// Command indexer consumes Q&A contract events and writes them into Postgres.
package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/ethereum/go-ethereum/common"
	_ "github.com/joho/godotenv/autoload"

	"github.com/knowmarket/event/internal/chain"
	"github.com/knowmarket/event/internal/config"
	"github.com/knowmarket/event/internal/db"
	"github.com/knowmarket/event/internal/indexer"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("load config", "err", err)
		os.Exit(1)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	client, err := chain.Dial(ctx, cfg.ChainRPCURL, int64(cfg.ChainID))
	if err != nil {
		logger.Error("dial rpc", "err", err)
		os.Exit(1)
	}
	defer client.Close()

	qna, err := chain.LoadQnA(common.HexToAddress(cfg.QnAContractAddress))
	if err != nil {
		logger.Error("load qna abi", "err", err)
		os.Exit(1)
	}

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("open postgres", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	loop := &indexer.Loop{
		ChainID:           cfg.ChainID,
		Confirmations:     cfg.Confirmations,
		MaxBlocksPerBatch: cfg.MaxBlocksPerBatch,
		PollInterval:      cfg.PollInterval,
		StartBlock:        cfg.StartBlock,
		Client:            client,
		QnA:               qna,
		Pool:              pool,
		Log:               logger,
	}

	logger.Info("indexer starting",
		"chain_id", cfg.ChainID,
		"contract", cfg.QnAContractAddress,
		"start_block", cfg.StartBlock,
		"confirmations", cfg.Confirmations,
		"poll_ms", cfg.PollInterval.Milliseconds(),
	)
	err = loop.Run(ctx)
	if err != nil && !errors.Is(err, context.Canceled) {
		logger.Error("loop exited", "err", err)
		os.Exit(1)
	}
	logger.Info("indexer stopped")
}
