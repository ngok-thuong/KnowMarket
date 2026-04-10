# Backend (API)

## Purpose
- Golang API service: feed, post detail, profiles, auth (wallet signature), optional WebSocket.
- Reads/writes Postgres.
- Does **not** index chain directly (that belongs to `event/`).

## Suggested structure
- `cmd/`: main entrypoints
- `internal/`: **DDD modules** (bounded contexts)
- `api/`: (optional) legacy place for handlers; prefer `internal/interfaces/http/`
- `migrations/`: DB migrations
- `configs/`: config templates

## DDD layout
See `backend/docs/ddd-structure.md`.

