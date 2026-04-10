# 03) Data Model — Postgres schema (logical) + invariants

## 1. Modeling goals
- Fast queries: Q&A feed/detail/votes, post detail, contributions, purchases, revenue recipients, profiles.
- Idempotent ingestion: indexer replay vẫn đúng.
- Support revisions/edit history.
- Support premium encrypted content + access rights.
- Support Q&A bounty escrow + voting + resolve.

## 2. Core tables (logical schema)
> This is a logical schema for analysis. When implementing, convert it into migrations.

### 2.1 `users`
- `id` (pk)
- `wallet_address` (unique, normalized lowercase for EVM)
- `handle` (optional)
- `created_at`
- Derived stats (denormalized optional): `total_earned`, `accepted_contributions`, `posts_created`

### 2.2 `questions`
- `id` (pk)
- `chain_id`
- `onchain_question_id` (uint256 → store as text)
- `asker_wallet`
- `title`
- `question_cid` (plaintext CID or structured JSON CID)
- `bounty_token` (address)
- `bounty_amount` (numeric)
- `deadline_at` (timestamp)
- `status` enum: `open` | `resolved` | `expired` | `refunded`
- `winner_answer_id` (fk → answers, nullable)
- `created_tx_hash`, `created_block_number`
- `created_at`, `resolved_at`
- Indexes:
  - `(chain_id, onchain_question_id)` unique
  - `(status, deadline_at)`
  - `(asker_wallet, created_at)`

### 2.3 `answers`
- `id` (pk)
- `question_id` (fk → questions)
- `chain_id`
- `onchain_answer_id` (uint256 → store as text)
- `answerer_wallet`
- `answer_cid` (plaintext CID, recommended)
- `status` enum: `submitted` | `winner` | `lost`
- `created_tx_hash`, `created_block_number`
- `created_at`
- Unique:
  - `(chain_id, onchain_answer_id)` unique
- Indexes:
  - `(question_id, created_at)`

### 2.4 `answer_votes`
Materialized / query-friendly table for votes.
- `id` (pk)
- `question_id`
- `answer_id`
- `voter_wallet`
- `direction` enum: `up` | `down` (downvote optional MVP)
- `weight` int (MVP=1)
- `vote_tx_hash`, `vote_block_number`
- `created_at`
- Unique:
  - `(question_id, voter_wallet)` unique (MVP: 1 wallet = 1 vote per question)
- Indexes:
  - `(answer_id)`
  - `(question_id)`

### 2.5 `posts`
- `id` (pk)
- `chain_id`
- `onchain_post_id` (string/uint256 → store as text)
- `creator_wallet`
- `title`
- `visibility` enum: `public` | `unlisted` | `hidden`
- `access_type` enum: `free` | `premium`
- `price_amount` (numeric) + `price_token` (address)  (nullable if free)
- `current_revision_id` (fk → post_revisions)
- `created_tx_hash`, `created_block_number`
- `created_at`
- Indexes:
  - `(chain_id, onchain_post_id)` unique
  - `(creator_wallet, created_at)`

### 2.6 `post_revisions`
- `id` (pk)
- `post_id` (fk)
- `revision_number` (int, starts at 1)
- `content_cid` (free: plaintext CID; premium: ciphertext CID)
- `content_format` enum: `md` | `json` | `html` (choose one for MVP, e.g. `md`)
- `is_encrypted` bool
- `encryption_alg` text (e.g. `xchacha20poly1305`)
- `content_sha256` (optional integrity check)
- `created_tx_hash` (for on-chain edit event)
- `created_at`
- Unique: `(post_id, revision_number)`

### 2.7 `post_access`
Represents “buyer has access to post”.
- `id` (pk)
- `post_id`
- `buyer_wallet`
- `status` enum: `pending` | `confirmed` | `reverted`
- `purchase_tx_hash`
- `purchase_block_number`
- `confirmed_at`
- Unique:
  - `(post_id, buyer_wallet)` unique (one active access per user)
  - `(chain_id, purchase_tx_hash, log_index)` via event table (see 2.7)

### 2.8 `contributions`
User submits contribution artifact(s) (CID) to a post.
- `id`
- `post_id`
- `contributor_wallet`
- `kind` enum: `edit` | `research` | `code` | `translation` | `other`
- `artifact_cid` (proof-of-contribution receipt)
- `status` enum: `submitted` | `accepted` | `rejected`
- `share_bps` (0..10000) — only when accepted
- `submitted_tx_hash`
- `accepted_tx_hash` (optional if acceptance is on-chain)
- `created_at`, `updated_at`

### 2.9 `revenue_recipients`
Materialized view of who gets paid for a post.
- `id`
- `post_id`
- `wallet`
- `share_bps`
- `source` enum: `creator` | `contribution` | `platform`
- Unique: `(post_id, wallet)`

### 2.10 `chain_events` (idempotency backbone)
Raw event ingestion ledger.
- `id`
- `chain_id`
- `tx_hash`
- `log_index`
- `block_number`
- `event_name`
- `event_payload` (jsonb)
- `processed_at`
- Unique: `(chain_id, tx_hash, log_index)`

### 2.11 `failed_events`
- `chain_id`, `tx_hash`, `log_index`
- `error`, `retry_count`, `last_retry_at`

## 3. Invariants (must-hold rules)
- **I1**: `posts.current_revision_id` always points to the latest **confirmed** revision.
- **I2**: Premium post phải có `post_revisions.is_encrypted=true`.
- **I3**: `post_access.status=confirmed` only after the purchase event is confirmed (N confirmations).
- **I4**: Tổng `revenue_recipients.share_bps` = 10000 (100%) cho mỗi `post_id`.
- **I5**: Indexer phải idempotent theo `(chain_id, tx_hash, log_index)`.
- **I6**: `questions.status=resolved` only after the resolve event is confirmed; `winner_answer_id` is non-null when resolved.
- **I7**: MVP voting: unique `(question_id, voter_wallet)` enforces 1 wallet = 1 vote per question.

## 4. Content schemas (what is inside CID)
### 4.1 Free (plaintext) content JSON (suggested)
- `title` (string)
- `body_md` (string)
- `summary` (string, optional)
- `tags` (array)
- `attachments` (array of {name, url/cid, mime})

### 4.2 Premium (encrypted) payload
- Ciphertext stored on IPFS; client decrypts → same JSON schema as free.
- Keep a small public “preview” (free) in DB: excerpt/first 200 chars + tags.

