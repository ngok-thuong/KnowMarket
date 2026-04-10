# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

A **Web3-native knowledge marketplace** on EVM (target: Base/Arbitrum). Three interlocking loops:

1. **Bounty Q&A** — Pay-to-ask (lock USDC bounty) → free answers → community vote → smart contract auto-pays winner after deadline. No asker approval needed — permissionless resolve.
2. **Premium Content Paywall** — Creator encrypts content (XChaCha20-Poly1305) client-side, uploads ciphertext to IPFS, sells access on-chain. Buyer pays → indexer confirms → Key Service verifies and delivers decryption key → client decrypts.
3. **Contribution Marketplace** — Contributors submit proof-of-work receipts (IPFS CIDs). Owner accepts + assigns `shareBps` (0–10000). Revenue auto-splits among creator/contributors/platform via pull-payment withdrawals.

**AI role**: UX-only (ranking answers, summarizing threads, highlighting differences). AI must **never** influence on-chain payouts.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) |
| Backend API | Golang + Postgres |
| Smart Contracts | Solidity (EVM) — **not** Cosmos despite `blockchain/README.md` saying so; all specs target EVM |
| Indexer | Golang worker |
| Storage | IPFS (content CIDs) |
| DB | PostgreSQL |

## Development Commands

> **Note**: Project is in scaffolding phase. Commands below reflect the intended setup.

```bash
# Start local dev environment
docker-compose -f infra/compose/docker-compose.yml up -d

# Run database migrations (golang-migrate or goose)
make migrate

# Run API service
cd backend && go run cmd/api/main.go

# Run indexer
cd event && go run cmd/indexer/main.go

# Run backfill (reindex from block range)
cd event && go run cmd/backfill/main.go --from-block=N --to-block=M

# Run tests
cd backend && go test ./...
cd event && go test ./...

# Contract compile + test (Hardhat or Foundry)
cd blockchain && forge build
cd blockchain && forge test

# Frontend
cd frontend && npm install && npm run dev
```

## Repository Structure

```
backend/     Golang API: REST + WebSocket, auth, key service, read/write Postgres
blockchain/  Solidity contracts: QnA.sol + Content.sol + deploy scripts
event/       Golang indexer: subscribes chain events → upserts Postgres
frontend/    Next.js: Q&A UI, post UI, wallet connect, client-side encryption/decrypt
docs/        Full specs (read these before changing business logic)
infra/       docker-compose, container configs
```

## Service Boundaries

- **Indexer** is the only writer for on-chain state into Postgres. API does **not** index chain directly.
- **API** reads Postgres for all feed/detail queries. It only writes off-chain data (user profiles, drafts, session nonces).
- **Key Service** lives inside the API service (`backend/internal/keyservice/`). It is the only component that holds decryption keys (encrypted at rest). It **never** logs plaintext keys.
- **AI Service** is read-only from Postgres. It has no write path and zero influence on contract state.

## Core Business Logic Flows

### Q&A Flow
```
Asker: approve USDC → createQuestion(bounty, token, questionCid, deadline)
  → contract: transferFrom → escrow, emit QuestionCreated
  → indexer: upsert questions(status=open)

Answerer: upload answer → IPFS (answerCid) → submitAnswer(questionId, answerCid)
  → emit AnswerSubmitted → indexer: insert answers(status=submitted)

Voter: vote(questionId, answerId)
  → emit VoteCast → indexer: upsert answer_votes
  → constraint: UNIQUE(question_id, voter_wallet) — 1 wallet = 1 vote

Keeper/Anyone (after deadline): resolve(questionId)
  → contract: pick winner by max votes → transfer escrow → winner
  → emit QuestionResolved → indexer: question=resolved, winner_answer_id set

Fallback (voteCount=0): refund to asker minus platform fee → treasury
```

### Premium Content Flow
```
Creator (client-side):
  1. generate contentKey (32-byte random)
  2. encrypt content.json with XChaCha20-Poly1305 → ciphertext
  3. upload IPFS envelope {alg, nonce, ciphertext, aad, schema_version} → cipherCid
  4. POST /keys/store (authed) → API stores contentKey encrypted at rest
  5. createPost(isPremium=true, price, token, cipherCid, previewCid) on contract
  → emit PostCreated → indexer: upsert posts + post_revisions(rev=1, is_encrypted=true)

Buyer:
  1. purchaseAccess(postId) → emit AccessPurchased
  2. indexer waits N=12 confirmations → upsert post_access(status=confirmed)
  3. POST /keys/request {postId, wallet, nonce, signature}
     → Key Service: verify nonce (fresh, single-use) + sig + DB confirmed access
     → return contentKey
  4. fetch ciphertext from IPFS → decrypt client-side → render
```

### Contribution + Revenue Split Flow
```
Contributor: upload artifact → IPFS (artifactCid)
  → submitContribution(postId, kind, artifactCid)
  → emit ContributionSubmitted → indexer: contributions(status=submitted)

Owner: acceptContribution(postId, contribId, shareBps)
  → emit ContributionAccepted
  → indexer: contributions(status=accepted, share_bps=X)
  → recalculate revenue_recipients: creator + contributors + platform must sum to 10000 bps

Withdraw: any recipient calls withdraw(postId)
  → pull-payment: contract sends their earned share
```

### Indexer Idempotency
Every event processed by the indexer must:
1. Check `(chain_id, tx_hash, log_index)` in `chain_events` — skip if exists.
2. Wait N confirmations before marking state `confirmed`.
3. On reorg: mark affected rows `reverted`, backfill from safe checkpoint.
4. On failure: insert into `failed_events` for retry.

## Database Invariants (Must Never Be Violated)

| # | Rule |
|---|------|
| I1 | `posts.current_revision_id` always points to the latest **confirmed** revision |
| I2 | Premium post: `post_revisions.is_encrypted = true` always |
| I3 | `post_access.status = confirmed` only after N block confirmations |
| I4 | Sum of `revenue_recipients.share_bps` per post = **10000** exactly |
| I5 | Indexer idempotency: unique `(chain_id, tx_hash, log_index)` on `chain_events` |
| I6 | `questions.status = resolved` only after resolve event confirmed; `winner_answer_id` non-null |
| I7 | `UNIQUE(question_id, voter_wallet)` — one vote per wallet per question |

## Smart Contract Event Names (Locked)

Q&A: `QuestionCreated`, `AnswerSubmitted`, `VoteCast`, `QuestionResolved`

Content: `PostCreated`, `PostEdited`, `AccessPurchased`, `ContributionSubmitted`, `ContributionAccepted`

Do not rename these without updating the indexer decoders and `docs/spec/events.md`.

## Encryption Format (Locked)

IPFS ciphertext envelope (JSON):
```json
{
  "alg": "xchacha20poly1305",
  "nonce": "<base64>",
  "ciphertext": "<base64>",
  "aad": "<base64 of postId:revision>",
  "schema_version": 1
}
```

Key granularity: **per-post** (MVP) — one `contentKey` reused across revisions.

## Key Service Rules

- `POST /keys/store` — creator-authed, stores key encrypted at rest, never logged
- `POST /keys/request` — verify nonce (single-use, 5-min TTL) + EIP-191 sig + DB confirmed access
- Never log plaintext keys — log only `{postId, wallet, requestId, result}`
- Fallback: if DB uncertain, call `contract.hasAccess(postId, wallet)` directly

## Auth: Wallet Signature Flow

```
Client: POST /auth/nonce → server issues UUID nonce (stored, 5-min TTL, single-use)
Client: sign nonce with wallet (EIP-191) → POST /auth/verify {wallet, nonce, sig}
Server: recover address from sig, verify matches wallet, verify nonce → issue JWT
```

Anti-replay: nonce deleted from store immediately after successful verify.

## Pending State UX Pattern

All on-chain writes follow this state machine in the frontend:
`idle → approving (ERC20) → tx_pending → indexer_pending → confirmed → [error/reverted]`

The indexer signals confirmed state; frontend polls or receives WebSocket push.

## Key Docs to Read Before Changing Business Logic

- `docs/01-overview.md` — vision, MVP scope, V2+ scope
- `docs/02-architecture.md` — component diagram, trust assumptions
- `docs/03-data-model.md` — full Postgres schema + invariants
- `docs/05-flows.md` — mermaid sequence diagrams for premium + indexer
- `docs/flows/flows.md` — full Q&A + premium flow analysis
- `docs/spec/events.md` — canonical event schema (indexer source of truth)
- `docs/spec/encryption-and-keys.md` — encryption format + key service spec
- `docs/08-risks-hard-parts.md` — known hard problems and mitigations

## Constraints That Must Not Change Without Discussion

- **AI never triggers payouts** — AI service is read-only, zero write access to payout-related tables or contracts.
- **Plaintext premium content never goes to IPFS** — always encrypt client-side first.
- **Chain reads in API path are a last resort** — use indexer → Postgres as the fast path; chain reads are fallback only.
- **Pull payments only** — no push loops in contracts (reentrancy risk).
- **EVM (Solidity), not Cosmos** — `blockchain/README.md` is outdated; all specs and event schemas are EVM-only.
