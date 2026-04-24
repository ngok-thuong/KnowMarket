// Package config loads environment-based settings for the event indexer.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds runtime settings for the indexer.
type Config struct {
	DatabaseURL        string
	ChainID            int
	ChainRPCURL        string
	Confirmations      uint64
	QnAContractAddress string
	PollInterval       time.Duration
	MaxBlocksPerBatch  uint64
	StartBlock         uint64
}

// Load reads required env vars and applies defaults for optional ones.
func Load() (*Config, error) {
	cfg := &Config{}

	cfg.DatabaseURL = os.Getenv("DATABASE_URL")
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	chainID, err := intEnv("CHAIN_ID", 0)
	if err != nil {
		return nil, err
	}
	if chainID == 0 {
		return nil, fmt.Errorf("CHAIN_ID is required")
	}
	cfg.ChainID = chainID

	cfg.ChainRPCURL = os.Getenv("CHAIN_RPC_URL")
	if cfg.ChainRPCURL == "" {
		return nil, fmt.Errorf("CHAIN_RPC_URL is required")
	}

	conf, err := uintEnv("CHAIN_CONFIRMATIONS", 1)
	if err != nil {
		return nil, err
	}
	cfg.Confirmations = conf

	addr := strings.TrimSpace(os.Getenv("QNA_CONTRACT_ADDRESS"))
	if addr == "" || addr == "0x0000000000000000000000000000000000000000" {
		return nil, fmt.Errorf("QNA_CONTRACT_ADDRESS is required")
	}
	cfg.QnAContractAddress = addr

	pollMs, err := uintEnv("INDEXER_POLL_INTERVAL_MS", 2000)
	if err != nil {
		return nil, err
	}
	cfg.PollInterval = time.Duration(pollMs) * time.Millisecond

	batch, err := uintEnv("INDEXER_MAX_BLOCKS_PER_BATCH", 2000)
	if err != nil {
		return nil, err
	}
	if batch == 0 {
		return nil, fmt.Errorf("INDEXER_MAX_BLOCKS_PER_BATCH must be > 0")
	}
	cfg.MaxBlocksPerBatch = batch

	start, err := uintEnv("INDEXER_START_BLOCK", 0)
	if err != nil {
		return nil, err
	}
	cfg.StartBlock = start

	return cfg, nil
}

func intEnv(key string, def int) (int, error) {
	v := os.Getenv(key)
	if v == "" {
		return def, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", key, err)
	}
	return n, nil
}

func uintEnv(key string, def uint64) (uint64, error) {
	v := os.Getenv(key)
	if v == "" {
		return def, nil
	}
	n, err := strconv.ParseUint(v, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", key, err)
	}
	return n, nil
}
