# Backend DDD structure — KnowMarket API

This document is the **canonical layout** for the Golang API. Code should move toward it incrementally; new features should **start** in the right layer/context.

## Principles

1. **Dependency rule**: source dependencies point **inward** — `interfaces` → `application` → `domain`; `infrastructure` implements ports defined in `application` (or `domain` for simple repos).
2. **One bounded context per folder** under `internal/`. Do not merge unrelated domains into a single `services` package.
3. **Indexer** (`event/`) is a **separate process** and its own bounded contexts; it writes the on-chain read model. The API **does not** duplicate indexer write paths.

## Bounded contexts (API)


| Context           | Responsibility                                                       | Writes (API)                                          |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| **identity**      | Wallet SIWE auth, sessions, user profile (off-chain), platform roles | `users`, `auth_nonces`, `user_sessions`, `user_roles` |
| **notifications** | (later) fan-out, read state                                          | `notifications`                                       |
| **moderation**    | (later) reports, admin audit                                         | `reports`, `admin_actions`                            |
| **catalog**       | (later) tags, search helpers                                         | `tags`, junction tables owned by API                  |


Contexts that are **read-only from API** (Indexer owns writes): `qa`, `content`, `marketplace` — the API exposes queries and DTOs but **no** write repositories for `questions`, `posts`, etc.

## Folder layout (per context)

Use this shape under `internal/<context>/`:

```
internal/identity/
  domain/              # entities, value objects, domain errors; NO imports from outer layers
    user.go            # User aggregate root (wallet, active flag)
    nonce.go           # rules: nonce format, TTL semantics (pure functions / methods)
  application/         # use cases + ports (interfaces)
    siwe_login.go      # VerifySiweLogin (SIWE verify)
    register_nonce.go  # (next) RegisterNonce use case
    ports.go           # (next) UserRepository, NonceRepository, SessionRepository
  infrastructure/
    persistence/       # Postgres implementations of ports
      user_repo.go
      nonce_repo.go
      session_repo.go
  interfaces/
    http/              # thin HTTP: decode JSON → call application → map errors to status
      auth_handler.go
```

**Shared** (cross-cutting, not a business context):

```
internal/shared/
  config/              # env → Config
  db/                  # pgx pool factory
  httperr/             # optional: map domain errors → HTTP
```

`cmd/api/main.go` wires: load `shared/config`, `shared/db`, construct repositories, inject into application handlers, mount `interfaces/http` router.

## Identity context — auth flow (SIWE)

1. **Application** `RegisterNonce(wallet)` → persist nonce via `NonceRepository`, return DTO for FE (nonce + SIWE hints: domain, uri, chainId from config).
2. **Application** `VerifySiwe(message, signature)` →
  - parse + verify SIWE: `internal/identity/application/siwe_login.go`
  - `NonceRepository.Consume(wallet, nonce)` (transactional)
  - `UserRepository.UpsertByWallet`
  - `SessionRepository.Create` + issue JWT (token signing in application or `infrastructure/jwt`)
3. **Interfaces** HTTP only validates input shape and calls the use case.

## Anti-patterns to avoid

- Handlers that **import `pgx` directly** and run SQL (bypass application).
- **God package** mixing HTTP + SQL in one folder — keep HTTP under `interfaces/http`, SQL under `infrastructure/persistence`.
- API writing **indexer-owned** tables “for convenience” — use indexer or explicit admin tooling.

## Scaffold status (repo layout)


| Layer                         | Path                                           |
| ----------------------------- | ---------------------------------------------- |
| Shared config                 | `internal/shared/config`                       |
| Shared DB pool                | `internal/shared/db`                           |
| Identity — SIWE verify        | `internal/identity/application/siwe_login.go`  |
| Identity — domain placeholder | `internal/identity/domain`                     |
| Identity — HTTP (next)        | `internal/identity/interfaces/http`            |
| Identity — repos (next)       | `internal/identity/infrastructure/persistence` |


Next: `cmd/api`, ports in `identity/application`, Postgres repos, thin HTTP handlers.

## Testing (DDD-friendly)

- **Domain**: table-driven tests, no DB.
- **Application**: mock ports (interfaces); test use case rules.
- **Infrastructure**: integration tests with real Postgres (testcontainers optional) or `pgxpool` against docker compose.

---

**Summary:** New code goes under `internal/<bounded_context>/{domain,application,infrastructure,interfaces}`; shared infrastructure stays in `internal/shared`. The API remains a modular monolith until a context truly needs extraction.