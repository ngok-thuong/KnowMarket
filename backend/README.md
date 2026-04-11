# Backend (API)

Golang API: profiles, auth (SIWE), feed/detail (reads Postgres). Does **not** index chain (see `event/`).

## Layout (DDD)

```
internal/
  shared/                    # cross-cutting
    config/                  # env → Config
    db/                      # Postgres pool
  identity/                  # bounded context: wallet auth, sessions, users
    domain/                  # aggregates / value objects (no SQL/HTTP)
    application/             # use cases (e.g. SIWE verify)
    infrastructure/
      persistence/           # Postgres repository implementations (next)
    interfaces/
      http/                  # HTTP handlers (next)
cmd/api/                     # entrypoint (when added)
migrations/                  # SQL migrations
docs/
  ddd-structure.md           # full DDD conventions
```

See `docs/ddd-structure.md` for dependency rules and bounded contexts.

## Commands

- `make migrate-auth-up` / `make migrate-auth-down` — from `backend/` (needs Docker Postgres).
