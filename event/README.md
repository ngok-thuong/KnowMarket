# Event (Indexer / Worker)

## Purpose
- Subscribe to blockchain events (Cosmos RPC/WebSocket).
- Wait for finality policy (as applicable) then upsert Postgres.
- Provide idempotency & backfill.

## Suggested structure
- `cmd/`: entrypoints (indexer, backfill)
- `adapters/`: chain adapters (cosmos), future multi-chain
- `indexer/`: event loop, checkpoints, decoders
- `worker/`: retry jobs, IPFS fetch/pin, reconciliation
- `internal/`: shared libs (db, logger, metrics)
- `configs/`: config templates

