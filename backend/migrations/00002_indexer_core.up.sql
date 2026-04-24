-- Indexer shared infrastructure: chain_events (idempotency ledger),
-- failed_events (retry queue), indexer_checkpoints (reorg/backfill anchor).
-- Owned by the indexer worker; the API reads for debugging/ops only.

CREATE TABLE chain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INT NOT NULL,
    tx_hash TEXT NOT NULL
        CONSTRAINT chk_chain_events_tx_hash CHECK (tx_hash ~ '^0x[a-f0-9]{64}$'),
    log_index INT NOT NULL
        CONSTRAINT chk_chain_events_log_index CHECK (log_index >= 0),
    block_number BIGINT NOT NULL
        CONSTRAINT chk_chain_events_block_number CHECK (block_number >= 0),
    block_hash TEXT NOT NULL
        CONSTRAINT chk_chain_events_block_hash CHECK (block_hash ~ '^0x[a-f0-9]{64}$'),
    event_name TEXT NOT NULL,
    event_payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chain_events_log UNIQUE (chain_id, tx_hash, log_index)
);

CREATE INDEX idx_chain_events_chain_block ON chain_events (chain_id, block_number);
CREATE INDEX idx_chain_events_event_name ON chain_events (event_name);

CREATE TABLE failed_events (
    chain_id INT NOT NULL,
    tx_hash TEXT NOT NULL
        CONSTRAINT chk_failed_events_tx_hash CHECK (tx_hash ~ '^0x[a-f0-9]{64}$'),
    log_index INT NOT NULL
        CONSTRAINT chk_failed_events_log_index CHECK (log_index >= 0),
    block_number BIGINT NOT NULL
        CONSTRAINT chk_failed_events_block_number CHECK (block_number >= 0),
    event_name TEXT,
    event_payload JSONB,
    error TEXT NOT NULL,
    retry_count INT NOT NULL DEFAULT 0
        CONSTRAINT chk_failed_events_retry_count CHECK (retry_count >= 0),
    last_retry_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_failed_events PRIMARY KEY (chain_id, tx_hash, log_index)
);

CREATE INDEX idx_failed_events_next_retry ON failed_events (next_retry_at)
    WHERE next_retry_at IS NOT NULL;

CREATE TABLE indexer_checkpoints (
    chain_id INT PRIMARY KEY,
    last_processed_block BIGINT NOT NULL
        CONSTRAINT chk_checkpoint_last_block CHECK (last_processed_block >= 0),
    last_processed_block_hash TEXT NOT NULL
        CONSTRAINT chk_checkpoint_last_hash CHECK (last_processed_block_hash ~ '^0x[a-f0-9]{64}$'),
    safe_block BIGINT NOT NULL
        CONSTRAINT chk_checkpoint_safe_block CHECK (safe_block >= 0),
    safe_block_hash TEXT NOT NULL
        CONSTRAINT chk_checkpoint_safe_hash CHECK (safe_block_hash ~ '^0x[a-f0-9]{64}$'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
