package indexer

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/knowmarket/event/internal/chain"
)

// Loop polls the chain for QnA logs and applies them to Postgres.
type Loop struct {
	ChainID           int
	Confirmations     uint64
	MaxBlocksPerBatch uint64
	PollInterval      time.Duration
	StartBlock        uint64

	Client *ethclient.Client
	QnA    *chain.QnA
	Pool   *pgxpool.Pool
	Log    *slog.Logger
}

const zeroBlockHash = "0x0000000000000000000000000000000000000000000000000000000000000000"

// Run starts the polling loop. It returns when ctx is cancelled.
func (l *Loop) Run(ctx context.Context) error {
	handler := &Handler{ChainID: l.ChainID, QnA: l.QnA}

	if err := l.ensureCheckpoint(ctx); err != nil {
		return fmt.Errorf("ensure checkpoint: %w", err)
	}

	// Run one tick immediately so we don't wait PollInterval on start-up.
	if err := l.tick(ctx, handler); err != nil {
		l.Log.Error("tick failed", "err", err)
	}

	ticker := time.NewTicker(l.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			if err := l.tick(ctx, handler); err != nil {
				l.Log.Error("tick failed", "err", err)
			}
		}
	}
}

func (l *Loop) ensureCheckpoint(ctx context.Context) error {
	var startHash string = zeroBlockHash
	if l.StartBlock > 0 {
		h, err := l.blockHash(ctx, l.StartBlock)
		if err != nil {
			return fmt.Errorf("start block hash: %w", err)
		}
		startHash = h
	}
	_, err := l.Pool.Exec(ctx, `
		INSERT INTO indexer_checkpoints (
			chain_id, last_processed_block, last_processed_block_hash,
			safe_block, safe_block_hash, updated_at
		) VALUES ($1, $2, $3, $2, $3, now())
		ON CONFLICT (chain_id) DO NOTHING
	`, l.ChainID, int64(l.StartBlock), startHash)
	return err
}

func (l *Loop) tick(ctx context.Context, h *Handler) error {
	head, err := l.Client.BlockNumber(ctx)
	if err != nil {
		return fmt.Errorf("block number: %w", err)
	}
	if head < l.Confirmations {
		return nil
	}
	safeHead := head - l.Confirmations

	var lastProcessed uint64
	if err := l.Pool.QueryRow(ctx,
		`SELECT last_processed_block FROM indexer_checkpoints WHERE chain_id = $1`,
		l.ChainID,
	).Scan(&lastProcessed); err != nil {
		return fmt.Errorf("read checkpoint: %w", err)
	}
	if safeHead <= lastProcessed {
		return nil
	}

	from := lastProcessed + 1
	to := from + l.MaxBlocksPerBatch - 1
	if to > safeHead {
		to = safeHead
	}

	logs, err := l.Client.FilterLogs(ctx, ethereum.FilterQuery{
		FromBlock: new(big.Int).SetUint64(from),
		ToBlock:   new(big.Int).SetUint64(to),
		Addresses: []common.Address{l.QnA.Address},
		Topics:    [][]common.Hash{l.QnA.AllTopic0()},
	})
	if err != nil {
		return fmt.Errorf("filter logs [%d,%d]: %w", from, to, err)
	}

	for _, log := range logs {
		if err := l.processLog(ctx, h, log); err != nil {
			l.Log.Error("process log failed",
				"tx", log.TxHash.Hex(),
				"log_index", log.Index,
				"err", err,
			)
			if ferr := l.pushFailed(ctx, log, err); ferr != nil {
				l.Log.Error("push failed_events", "err", ferr)
			}
		}
	}

	toHash, err := l.blockHash(ctx, to)
	if err != nil {
		return fmt.Errorf("hash of block %d: %w", to, err)
	}
	if _, err := l.Pool.Exec(ctx, `
		UPDATE indexer_checkpoints
		SET last_processed_block      = $2,
		    last_processed_block_hash = $3,
		    safe_block                = $2,
		    safe_block_hash           = $3,
		    updated_at                = now()
		WHERE chain_id = $1
	`, l.ChainID, int64(to), toHash); err != nil {
		return fmt.Errorf("advance checkpoint: %w", err)
	}

	l.Log.Info("batch processed",
		"from", from, "to", to, "head", head, "logs", len(logs),
	)
	return nil
}

func (l *Loop) blockHash(ctx context.Context, num uint64) (string, error) {
	hdr, err := l.Client.HeaderByNumber(ctx, new(big.Int).SetUint64(num))
	if err != nil {
		return "", err
	}
	return strings.ToLower(hdr.Hash().Hex()), nil
}

func (l *Loop) processLog(ctx context.Context, h *Handler, log types.Log) error {
	if log.Removed {
		// MVP: skip removed logs. A full reorg strategy lives in the future
		// backfill worker and flips affected rows to a 'reverted' state.
		return nil
	}

	eventName := l.QnA.EventNameFromTopic0(log.Topics[0])
	if eventName == "" {
		return nil
	}

	payload, err := encodePayload(eventName, log)
	if err != nil {
		return fmt.Errorf("encode payload: %w", err)
	}

	tx, err := l.Pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx, `
		INSERT INTO chain_events (
			chain_id, tx_hash, log_index, block_number, block_hash,
			event_name, event_payload
		) VALUES ($1,$2,$3,$4,$5,$6,$7)
		ON CONFLICT (chain_id, tx_hash, log_index) DO NOTHING
	`,
		l.ChainID,
		strings.ToLower(log.TxHash.Hex()),
		int(log.Index),
		int64(log.BlockNumber),
		strings.ToLower(log.BlockHash.Hex()),
		eventName,
		payload,
	)
	if err != nil {
		return fmt.Errorf("insert chain_events: %w", err)
	}
	if tag.RowsAffected() == 0 {
		// Already processed in a previous run; commit the (empty) tx and move on.
		return tx.Commit(ctx)
	}

	if err := h.HandleLog(ctx, tx, log, eventName); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (l *Loop) pushFailed(ctx context.Context, log types.Log, handlerErr error) error {
	eventName := l.QnA.EventNameFromTopic0(log.Topics[0])
	payload, _ := encodePayload(eventName, log)
	_, err := l.Pool.Exec(ctx, `
		INSERT INTO failed_events (
			chain_id, tx_hash, log_index, block_number,
			event_name, event_payload, error, retry_count, created_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,0, now())
		ON CONFLICT (chain_id, tx_hash, log_index) DO UPDATE
		SET error         = EXCLUDED.error,
		    retry_count   = failed_events.retry_count + 1,
		    last_retry_at = now()
	`,
		l.ChainID,
		strings.ToLower(log.TxHash.Hex()),
		int(log.Index),
		int64(log.BlockNumber),
		eventName,
		payload,
		handlerErr.Error(),
	)
	return err
}

func encodePayload(eventName string, log types.Log) ([]byte, error) {
	topics := make([]string, len(log.Topics))
	for i, t := range log.Topics {
		topics[i] = strings.ToLower(t.Hex())
	}
	return json.Marshal(map[string]any{
		"event":  eventName,
		"topics": topics,
		"data":   fmt.Sprintf("0x%x", log.Data),
	})
}
