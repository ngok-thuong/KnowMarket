package indexer

import (
	"context"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/jackc/pgx/v5"

	"github.com/knowmarket/event/internal/chain"
)

// Handler applies a decoded log to the Q&A read model inside a pgx.Tx.
// The caller must have already inserted the chain_events row in the same tx;
// if that insert was a no-op (duplicate), the caller skips HandleLog.
type Handler struct {
	ChainID int
	QnA     *chain.QnA
}

func (h *Handler) HandleLog(ctx context.Context, tx pgx.Tx, log types.Log, eventName string) error {
	switch eventName {
	case chain.EventQuestionCreated:
		var e QuestionCreatedEvt
		if err := h.QnA.Bound.UnpackLog(&e, eventName, log); err != nil {
			return fmt.Errorf("unpack %s: %w", eventName, err)
		}
		return h.onQuestionCreated(ctx, tx, log, e)
	case chain.EventAnswerSubmitted:
		var e AnswerSubmittedEvt
		if err := h.QnA.Bound.UnpackLog(&e, eventName, log); err != nil {
			return fmt.Errorf("unpack %s: %w", eventName, err)
		}
		return h.onAnswerSubmitted(ctx, tx, log, e)
	case chain.EventVoteCast:
		var e VoteCastEvt
		if err := h.QnA.Bound.UnpackLog(&e, eventName, log); err != nil {
			return fmt.Errorf("unpack %s: %w", eventName, err)
		}
		return h.onVoteCast(ctx, tx, log, e)
	case chain.EventQuestionResolved:
		var e QuestionResolvedEvt
		if err := h.QnA.Bound.UnpackLog(&e, eventName, log); err != nil {
			return fmt.Errorf("unpack %s: %w", eventName, err)
		}
		return h.onQuestionResolved(ctx, tx, log, e)
	default:
		return fmt.Errorf("unknown event: %s", eventName)
	}
}

func (h *Handler) onQuestionCreated(ctx context.Context, tx pgx.Tx, log types.Log, e QuestionCreatedEvt) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO questions (
			chain_id, onchain_question_id, asker_wallet,
			question_cid, bounty_token, bounty_amount, deadline_at,
			status, created_tx_hash, created_block_number
		) VALUES ($1,$2,$3,$4,$5,$6, to_timestamp($7), 'open', $8, $9)
		ON CONFLICT (chain_id, onchain_question_id) DO NOTHING
	`,
		h.ChainID,
		e.QuestionId.String(),
		strings.ToLower(e.Asker.Hex()),
		nullIfEmpty(e.QuestionCid),
		strings.ToLower(e.BountyToken.Hex()),
		e.BountyAmount.String(),
		int64(e.Deadline),
		strings.ToLower(log.TxHash.Hex()),
		int64(log.BlockNumber),
	)
	if err != nil {
		return fmt.Errorf("insert questions: %w", err)
	}
	return nil
}

func (h *Handler) onAnswerSubmitted(ctx context.Context, tx pgx.Tx, log types.Log, e AnswerSubmittedEvt) error {
	var questionUUID string
	if err := tx.QueryRow(ctx, `
		SELECT id FROM questions WHERE chain_id = $1 AND onchain_question_id = $2
	`, h.ChainID, e.QuestionId.String()).Scan(&questionUUID); err != nil {
		return fmt.Errorf("lookup question: %w", err)
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO answers (
			question_id, chain_id, onchain_answer_id,
			answerer_wallet, answer_cid,
			status, vote_count,
			created_tx_hash, created_block_number
		) VALUES ($1,$2,$3,$4,$5,'submitted',0,$6,$7)
		ON CONFLICT (chain_id, onchain_answer_id) DO NOTHING
	`,
		questionUUID,
		h.ChainID,
		e.AnswerId.String(),
		strings.ToLower(e.Answerer.Hex()),
		e.AnswerCid,
		strings.ToLower(log.TxHash.Hex()),
		int64(log.BlockNumber),
	)
	if err != nil {
		return fmt.Errorf("insert answers: %w", err)
	}
	return nil
}

func (h *Handler) onVoteCast(ctx context.Context, tx pgx.Tx, log types.Log, e VoteCastEvt) error {
	var questionUUID, answerUUID string
	if err := tx.QueryRow(ctx, `
		SELECT id FROM questions WHERE chain_id = $1 AND onchain_question_id = $2
	`, h.ChainID, e.QuestionId.String()).Scan(&questionUUID); err != nil {
		return fmt.Errorf("lookup question: %w", err)
	}
	if err := tx.QueryRow(ctx, `
		SELECT id FROM answers WHERE chain_id = $1 AND onchain_answer_id = $2
	`, h.ChainID, e.AnswerId.String()).Scan(&answerUUID); err != nil {
		return fmt.Errorf("lookup answer: %w", err)
	}

	direction := "up"
	if e.Direction < 0 {
		direction = "down"
	}

	tag, err := tx.Exec(ctx, `
		INSERT INTO answer_votes (
			question_id, answer_id, voter_wallet,
			direction, weight,
			vote_tx_hash, vote_block_number
		) VALUES ($1,$2,$3,$4::vote_direction,$5,$6,$7)
		ON CONFLICT (question_id, voter_wallet) DO NOTHING
	`,
		questionUUID,
		answerUUID,
		strings.ToLower(e.Voter.Hex()),
		direction,
		int32(e.Weight),
		strings.ToLower(log.TxHash.Hex()),
		int64(log.BlockNumber),
	)
	if err != nil {
		return fmt.Errorf("insert answer_votes: %w", err)
	}
	if tag.RowsAffected() == 1 {
		if _, err := tx.Exec(ctx, `
			UPDATE answers SET vote_count = vote_count + $1 WHERE id = $2
		`, int32(e.Weight), answerUUID); err != nil {
			return fmt.Errorf("increment vote_count: %w", err)
		}
	}
	return nil
}

func (h *Handler) onQuestionResolved(ctx context.Context, tx pgx.Tx, log types.Log, e QuestionResolvedEvt) error {
	var questionUUID, askerWallet string
	if err := tx.QueryRow(ctx, `
		SELECT id, asker_wallet FROM questions WHERE chain_id = $1 AND onchain_question_id = $2
	`, h.ChainID, e.QuestionId.String()).Scan(&questionUUID, &askerWallet); err != nil {
		return fmt.Errorf("lookup question: %w", err)
	}

	// Map resolution code → status + resolution_type.
	// Mirrors contract constants: 0=WINNER, 1=NO_ANSWER, 2=NO_VOTES.
	var (
		status         string
		resolutionType string
		winnerUUIDPtr  *string
		payoutType     string
		recipient      string
	)
	switch e.Resolution {
	case 0:
		status = "resolved"
		resolutionType = "winner_by_votes"
		var id string
		if err := tx.QueryRow(ctx, `
			SELECT id FROM answers WHERE chain_id = $1 AND onchain_answer_id = $2
		`, h.ChainID, e.WinnerAnswerId.String()).Scan(&id); err != nil {
			return fmt.Errorf("lookup winner answer: %w", err)
		}
		winnerUUIDPtr = &id
		payoutType = "winner"
		recipient = strings.ToLower(e.Winner.Hex())
	case 1:
		status = "refunded"
		resolutionType = "no_answer"
		payoutType = "refund"
		recipient = askerWallet
	case 2:
		status = "refunded"
		resolutionType = "no_votes"
		payoutType = "refund"
		recipient = askerWallet
	default:
		return fmt.Errorf("unknown resolution code: %d", e.Resolution)
	}

	payoutToken := strings.ToLower(e.PayoutToken.Hex())

	if _, err := tx.Exec(ctx, `
		UPDATE questions
		SET status           = $1::question_status,
		    winner_answer_id = $2,
		    resolution_type  = $3,
		    payout_amount    = $4,
		    payout_token     = $5,
		    resolved_at      = now()
		WHERE id = $6
	`, status, winnerUUIDPtr, resolutionType, e.PayoutAmount.String(), payoutToken, questionUUID); err != nil {
		return fmt.Errorf("update questions: %w", err)
	}

	if winnerUUIDPtr != nil {
		if _, err := tx.Exec(ctx, `
			UPDATE answers SET status = 'winner' WHERE id = $1
		`, *winnerUUIDPtr); err != nil {
			return fmt.Errorf("mark winner answer: %w", err)
		}
		if _, err := tx.Exec(ctx, `
			UPDATE answers SET status = 'lost' WHERE question_id = $1 AND id <> $2
		`, questionUUID, *winnerUUIDPtr); err != nil {
			return fmt.Errorf("mark losing answers: %w", err)
		}
	}

	// Record an audit row for the intended payout. The actual on-chain transfer
	// happens when the winner calls claimReward or the asker calls withdrawRefund;
	// those functions don't emit events in the current contract, so this row
	// captures the resolve-time intent.
	if e.PayoutAmount.Sign() > 0 {
		if _, err := tx.Exec(ctx, `
			INSERT INTO payouts (
				chain_id, question_id, recipient_wallet, amount, token, payout_type,
				tx_hash, block_number
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
			ON CONFLICT (chain_id, tx_hash, payout_type) DO NOTHING
		`,
			h.ChainID, questionUUID, recipient,
			e.PayoutAmount.String(), payoutToken, payoutType,
			strings.ToLower(log.TxHash.Hex()), int64(log.BlockNumber),
		); err != nil {
			return fmt.Errorf("insert payouts: %w", err)
		}
	}
	return nil
}

func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
