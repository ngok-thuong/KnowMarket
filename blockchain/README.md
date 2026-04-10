# Blockchain (Cosmos SDK - Go)

## Purpose
- Cosmos chain module(s) for:
  - Posts (create/edit revisions)
  - Access purchase (paywall)
  - Contributions submit/accept
  - Revenue split / withdrawals (or escrow-like accounting)
- Emits events that `event/` service indexes into Postgres.

## Suggested structure
- `app/`: Cosmos app wiring
- `cmd/`: binaries (node, cli)
- `proto/`: protobuf definitions
- `modules/`: custom modules (x/posts, x/access, x/contrib, x/revenue)
- `scripts/`: localnet scripts
- `docs/`: module specs, event list

## Event contract
Keep event schema consistent with `docs/spec/events.md` (adapted to Cosmos event format).

