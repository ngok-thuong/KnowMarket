# KnowMarket — Complete Entity Design & Business Logic Flows

> **Ultrathinking analysis** — covers every entity across BE and Indexer databases,
> all use-case flows, role system, ranking mechanics, and database invariants.

---

## Table of Contents

1. [Project Overview — The Three Loops](#1-project-overview)
2. [Role System](#2-role-system)
3. [Ranking & Reputation System](#3-ranking--reputation-system)
4. [Entity Catalog](#4-entity-catalog)
   - [4A — BE Database (API-managed)](#4a-be-database--api-managed)
   - [4B — Indexer Database (Indexer-managed)](#4b-indexer-database--indexer-managed)
5. [Use Case Flows](#5-use-case-flows)
6. [Event → DB Mapping](#6-event--db-mapping-complete)
7. [Database Invariants](#7-database-invariants)
8. [Writers Map (Service → Table Ownership)](#8-writers-map)
9. [Entity Relationship Summary](#9-entity-relationship-summary)

---

## 1. Project Overview

KnowMarket is a **Web3-native knowledge marketplace** on EVM. Three interlocking loops power it:

```
Loop 1 — Bounty Q&A
  Asker locks USDC → community answers free → community votes → contract auto-pays winner
  AI = UX-only (ranking, summary, highlights). NEVER influences payout.

Loop 2 — Premium Content Paywall
  Creator encrypts content (XChaCha20-Poly1305) client-side → uploads ciphertext to IPFS
  → sells access on-chain → Indexer confirms → Key Service delivers decryption key
  → Buyer decrypts client-side

Loop 3 — Contribution Marketplace
  Contributor submits proof-of-work (IPFS CID) → Owner/Reviewer accepts
  → assigns shareBps → revenue auto-splits among creator/contributors/platform
  → pull-payment withdrawals
```

**Data flow principle:**
- **Smart contracts** = source of truth for all on-chain state
- **Indexer** = sole writer for on-chain state into Postgres (with idempotency + N-confirmation)
- **API** = reads Postgres for all queries; writes only off-chain data (profiles, sessions, nonces, keys)
- **AI Service** = read-only from Postgres; zero write influence on payouts

---

## 2. Role System

### 2.1 Platform Roles (static, stored in `user_roles`)

| Role | Description | Who grants |
|------|-------------|------------|
| `normal_user` | Default — any wallet-connected user. No row needed. | Auto on wallet connect |
| `moderator` | Can review reports, hide content, manage abuse flags | Admin |
| `admin` | Full platform access: all above + config, role management, emergency pause | System / other admin |

> **Guest** = no wallet connected. Can browse public feed only.

### 2.2 Resource Roles (contextual, derived from data)

| Role | How derived | Powers |
|------|-------------|--------|
| **Project Owner** | Has at least one row in `projects` with `owner_id = user.id` | Create/manage projects, invite reviewers, set contribution policy |
| **Post Owner** | `posts.creator_wallet = wallet_address` | Edit post (new revision), accept/reject contributions to that post |
| **Reviewer** | Row in `project_reviewers` for that project | Accept/reject contributions on behalf of project owner |
| **Asker** | Contextual — user who created a question | They paid the bounty, can see pending tx state |
| **Answerer** | Contextual — user who answered a question | Can win the bounty |
| **Voter** | Contextual — user who cast a vote | 1 vote per question |
| **Buyer/Reader** | Has `post_access.status = confirmed` for a post | Can request decryption key |
| **Contributor** | Has submitted a contribution | Can see their contribution status |

### 2.3 Permissions Matrix

| Action | Guest | Normal User | Moderator | Admin | Project Owner | Post Owner | Reviewer |
|--------|-------|-------------|-----------|-------|---------------|------------|---------|
| Browse public feed | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Connect wallet / sign in | ✓ | — | — | — | — | — | — |
| Ask question (lock bounty) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Submit answer | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Vote | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Resolve question (permissionless) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create post (free/premium) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit own post | ✗ | own only | own only | ✓ | own only | ✓ | ✗ |
| Purchase premium access | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Request decryption key | ✗ | if buyer | if buyer | ✓ | if buyer | ✓ (owns) | if buyer |
| Submit contribution | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Accept/reject contribution | ✗ | ✗ | ✗ | ✓ | own projects | own posts | delegated posts |
| Create project | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invite reviewer | ✗ | ✗ | ✗ | ✓ | own projects | — | ✗ |
| Hide/suspend content | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage user roles | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| View platform config | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |

---

## 3. Ranking & Reputation System

### 3.1 Why Ranking

Ranking creates a **reputation economy** that:
- Incentivizes quality answers (winners rise in Q&A leaderboard)
- Rewards content creators (premium sales → Creator rank)
- Values trustworthy contributors (accepted contributions → Contributor rank)
- Feeds V2 stake-based voting (reputation score as vote weight)

### 3.2 Reputation Score Formula

```
reputation_score =
  -- Q&A dimension (primary: winning bounties)
  (answers_won              × 1000) +
  (bounty_earned_usd_cents  ÷   10) +   -- $1 earned = 10 pts
  (vote_accuracy_bps        ×    5) +   -- rewarding accurate community judgment
  (questions_resolved_with_winner × 50) + -- asking quality questions

  -- Content dimension (primary: revenue + reach)
  (revenue_earned_usd_cents ÷   10) +   -- $1 earned = 10 pts
  (total_unique_buyers       ×  100) +   -- each unique buyer = 100 pts
  (premium_posts_created     ×  200) +

  -- Contribution dimension
  (contributions_accepted    ×  500) +
  (contribution_revenue_earned_usd_cents ÷ 10)
```

> **Anti-wash**: self-purchases excluded from `total_unique_buyers`.
> Users flagged for wash-trading have score frozen pending admin review.

### 3.3 Leaderboard Categories

| Category | Primary signal | Period |
|----------|---------------|--------|
| `overall` | Full `reputation_score` | all_time / monthly / weekly |
| `qa_answerer` | `answers_won` + `bounty_earned` | all_time / monthly |
| `qa_asker` | `questions_resolved_with_winner` (quality of questions) | all_time / monthly |
| `creator` | `revenue_earned` + `total_unique_buyers` | all_time / monthly |
| `contributor` | `contributions_accepted` + `contribution_revenue` | all_time / monthly |

Rankings computed by **periodic background job** (every 15 minutes) + triggered async on key events
(bounty won, purchase confirmed, contribution accepted).

### 3.4 Badges

| Badge | Trigger condition |
|-------|------------------|
| `first_bounty_win` | `answers_won` goes from 0 → 1 |
| `expert_answerer` | `answers_won >= 10` |
| `content_creator` | `posts_created >= 5` |
| `revenue_earner` | `revenue_earned_usd_cents >= 10000` ($100+) |
| `top_contributor` | `contributions_accepted >= 5` |
| `accurate_voter` | `vote_accuracy_bps >= 8000` (≥80%) with `votes_cast >= 20` |
| `platform_champion` | Rank #1 in `overall` leaderboard |

### 3.5 Vote Accuracy Calculation

```
vote_accuracy_bps = (votes_cast_for_winner / total_votes_cast) × 10000
```
Computed after questions resolve. Only counts votes in resolved questions.

---

## 4. Entity Catalog

> **Database architecture**: Both BE and Indexer write to the **same PostgreSQL cluster**
> (one DB, one schema) in MVP. Service ownership is enforced by convention and documented below.
> V2 may split into separate databases with the Indexer feeding a read replica.

---

### 4A — BE Database (API-managed)

These tables are **created and written by the API service** (backend). The Indexer reads them only
for cross-reference (e.g., checking `post_access` in Key Service).

---

#### `users`
User profile, indexed by wallet address.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default gen | |
| `wallet_address` | TEXT | UNIQUE NOT NULL | Lowercase hex, e.g. `0xabc...` |
| `handle` | TEXT | UNIQUE, nullable | Optional display name |
| `avatar_cid` | TEXT | nullable | IPFS CID of avatar image |
| `bio` | TEXT | nullable | |
| `is_active` | BOOL | NOT NULL, default true | False = banned/suspended |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

**Indexes**: `wallet_address` (unique), `handle` (unique)

---

#### `user_roles`
Platform-level role assignments. Absence of a row = `normal_user`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `role` | ENUM | NOT NULL | `admin \| moderator` |
| `granted_by` | UUID | FK → users, nullable | Who granted this role |
| `granted_at` | TIMESTAMPTZ | NOT NULL | |
| `revoked_at` | TIMESTAMPTZ | nullable | Soft revoke |

**Constraints**: `UNIQUE(user_id, role)`

---

#### `user_sessions`
JWT session tracking. Enables token revocation.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `jti` | TEXT | UNIQUE NOT NULL | JWT ID claim |
| `wallet_address` | TEXT | NOT NULL | Denormalized for fast lookup |
| `issued_at` | TIMESTAMPTZ | NOT NULL | |
| `expires_at` | TIMESTAMPTZ | NOT NULL | |
| `revoked_at` | TIMESTAMPTZ | nullable | Explicit logout |
| `user_agent` | TEXT | nullable | |
| `ip_address` | INET | nullable | |

**Indexes**: `(user_id)`, `(jti)` unique

---

#### `auth_nonces`
Single-use wallet signature challenges. TTL = 5 minutes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `nonce` | UUID | PK, default gen | Issued as challenge |
| `wallet_address` | TEXT | NOT NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `expires_at` | TIMESTAMPTZ | NOT NULL | `now() + 5 min` |
| `used_at` | TIMESTAMPTZ | nullable | Set on successful verify |

**Flow**: `POST /auth/nonce` → create row. `POST /auth/verify` → set `used_at`, issue JWT.
Anti-replay: nonce is single-use; `used_at` non-null = already consumed.

---

#### `content_keys`
Encrypted content decryption keys. **NEVER store plaintext key here.**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `chain_id` | INT | NOT NULL | |
| `onchain_post_id` | TEXT | NOT NULL | uint256 from contract |
| `encrypted_key` | BYTEA | NOT NULL | Key encrypted at rest (AES-256-GCM) |
| `key_version` | INT | NOT NULL, default 1 | For key rotation |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

**Constraints**: `UNIQUE(chain_id, onchain_post_id)`

**Security**: Uses `onchain_post_id` as natural key to decouple from Indexer processing order.
Key Service can store the key before the Indexer has confirmed the `PostCreated` event.

---

#### `key_request_nonces`
Single-use nonces for Key Service requests. Prevents replay attacks on key delivery.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `nonce` | UUID | PK | Issued to buyer on request |
| `wallet_address` | TEXT | NOT NULL | |
| `onchain_post_id` | TEXT | NOT NULL | Scoped to specific post |
| `chain_id` | INT | NOT NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `expires_at` | TIMESTAMPTZ | NOT NULL | `now() + 5 min` |
| `used_at` | TIMESTAMPTZ | nullable | |

---

#### `projects`
A collection of related posts (e.g., a course series, a research project).
The "Project Owner" role is derived from owning a row in this table.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK → users, NOT NULL | The "Project Owner" |
| `slug` | TEXT | UNIQUE NOT NULL | URL-friendly identifier |
| `title` | TEXT | NOT NULL | |
| `description` | TEXT | nullable | |
| `cover_cid` | TEXT | nullable | IPFS CID for cover image |
| `category` | TEXT | nullable | e.g. `blockchain`, `ai`, `math` |
| `contribution_policy` | ENUM | NOT NULL, default `open` | `open \| invite_only \| closed` |
| `status` | ENUM | NOT NULL, default `active` | `active \| archived \| suspended` |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

**Indexes**: `(owner_id)`, `(slug)` unique

---

#### `project_reviewers`
Users delegated by the Project Owner to accept/reject contributions on their behalf.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `project_id` | UUID | FK → projects, NOT NULL | |
| `reviewer_id` | UUID | FK → users, NOT NULL | |
| `granted_by` | UUID | FK → users, NOT NULL | Must be project owner |
| `granted_at` | TIMESTAMPTZ | NOT NULL | |
| `revoked_at` | TIMESTAMPTZ | nullable | |

**PK**: `(project_id, reviewer_id)`

---

#### `user_stats`
Aggregated reputation metrics per user. Recomputed by background job every 15 minutes
and triggered on key events (bounty won, purchase confirmed, contribution accepted).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `user_id` | UUID | PK FK → users | |
| `questions_asked` | INT | 0 | |
| `questions_resolved_with_winner` | INT | 0 | Their questions that got a winner |
| `answers_submitted` | INT | 0 | |
| `answers_won` | INT | 0 | Bounties won |
| `bounty_earned_usd_cents` | BIGINT | 0 | Total bounty received |
| `bounty_spent_usd_cents` | BIGINT | 0 | Total bounty locked |
| `votes_cast` | INT | 0 | |
| `vote_accuracy_bps` | INT | 0 | 0–10000 (% votes for winners) |
| `posts_created` | INT | 0 | |
| `premium_posts_created` | INT | 0 | |
| `total_unique_buyers` | INT | 0 | Unique buyers across all posts (self excluded) |
| `revenue_earned_usd_cents` | BIGINT | 0 | From premium post sales |
| `contributions_submitted` | INT | 0 | |
| `contributions_accepted` | INT | 0 | |
| `contribution_revenue_earned_usd_cents` | BIGINT | 0 | Share earned from contributions |
| `reputation_score` | BIGINT | 0 | Composite score (see §3.2) |
| `last_computed_at` | TIMESTAMPTZ | NOW() | When stats were last refreshed |

---

#### `user_rankings`
Computed rank positions. One row per (user, category, period).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users | |
| `category` | ENUM | NOT NULL | `overall \| qa_answerer \| qa_asker \| creator \| contributor` |
| `period` | ENUM | NOT NULL | `all_time \| monthly \| weekly` |
| `rank_pos` | INT | NOT NULL | Position 1 = best |
| `score` | BIGINT | NOT NULL | Score at time of computation |
| `computed_at` | TIMESTAMPTZ | NOT NULL | |

**Constraints**: `UNIQUE(user_id, category, period)`

**Indexes**: `(category, period, rank_pos)` — for leaderboard queries

---

#### `user_badges`
Achievement badges earned. Checked on stat updates; awarded once.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users | |
| `badge` | ENUM | NOT NULL | See §3.4 |
| `earned_at` | TIMESTAMPTZ | NOT NULL | |

**Constraints**: `UNIQUE(user_id, badge)` — each badge awarded once

---

#### `tags`
Category/topic tags. Shared by questions and posts.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `name` | TEXT | UNIQUE NOT NULL |
| `slug` | TEXT | UNIQUE NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

---

#### `question_tags`
Many-to-many: questions ↔ tags.

| Column | Type | Notes |
|--------|------|-------|
| `question_id` | UUID | FK → questions |
| `tag_id` | UUID | FK → tags |

**PK**: `(question_id, tag_id)`

---

#### `post_tags`
Many-to-many: posts ↔ tags.

| Column | Type | Notes |
|--------|------|-------|
| `post_id` | UUID | FK → posts |
| `tag_id` | UUID | FK → tags |

**PK**: `(post_id, tag_id)`

---

#### `notifications`
User notification queue for WebSocket push or polling.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `type` | ENUM | See values below |
| `title` | TEXT | Short notification text |
| `body` | TEXT | nullable, longer detail |
| `related_entity_type` | TEXT | `question \| answer \| post \| contribution` |
| `related_entity_id` | UUID | nullable |
| `is_read` | BOOL | default false |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Notification types**: `question_resolved`, `answer_submitted_to_your_question`,
`bounty_won`, `access_confirmed`, `access_reverted`, `contribution_accepted`,
`contribution_rejected`, `contribution_submitted_to_your_post`, `withdrawal_completed`

**Indexes**: `(user_id, is_read, created_at DESC)` — for unread notification count

---

#### `reports`
Abuse/spam reports submitted by users. Reviewed by moderators.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `reporter_id` | UUID | FK → users |
| `entity_type` | ENUM | `question \| answer \| post \| contribution \| user` |
| `entity_id` | UUID | ID of the reported entity |
| `reason` | TEXT | NOT NULL |
| `details` | TEXT | nullable |
| `status` | ENUM | `pending \| reviewed \| actioned \| dismissed`, default `pending` |
| `reviewed_by` | UUID | FK → users (moderator/admin), nullable |
| `reviewed_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Indexes**: `(status, created_at)` — for moderator queue

---

#### `admin_actions`
Immutable audit log for all admin/moderator actions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `actor_id` | UUID | FK → users (admin/moderator) |
| `action` | TEXT | e.g. `suspend_user`, `hide_post`, `grant_role`, `dismiss_report` |
| `target_type` | TEXT | `user \| post \| question \| contribution` |
| `target_id` | UUID | nullable |
| `reason` | TEXT | nullable |
| `payload` | JSONB | Extra context (before/after state) |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Indexes**: `(actor_id, created_at DESC)`, `(target_type, target_id)`

---

#### `platform_config`
Key-value store for platform-wide tunable settings.

| Column | Type | Notes |
|--------|------|-------|
| `key` | TEXT | PK |
| `value` | TEXT | NOT NULL |
| `description` | TEXT | Human-readable description |
| `updated_by` | UUID | FK → users (admin) |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

**Initial seed values:**

| Key | Default | Meaning |
|-----|---------|---------|
| `min_bounty_usd_cents` | `100` | Minimum bounty ($1.00) to create a question |
| `platform_fee_bps` | `500` | Platform fee in bps (5%) |
| `indexer_confirmations` | `12` | N confirmations before marking confirmed |
| `max_contribution_share_bps` | `3000` | Max any single contribution can hold (30%) |
| `creator_min_share_bps` | `4000` | Creator always holds ≥40% (40%) |

---

#### `ai_rankings`
AI-generated answer rankings per question. Written by AI Service (UX-only, never affects payouts).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `question_id` | UUID | FK → questions |
| `answer_id` | UUID | FK → answers |
| `ai_score` | FLOAT4 | NOT NULL |
| `rank_position` | INT | NOT NULL, 1 = AI top pick |
| `reason` | TEXT | Why AI ranked this answer here |
| `model_version` | TEXT | NOT NULL |
| `computed_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(question_id, answer_id)`

---

#### `ai_summaries`
AI-generated thread summaries per question. UX-only.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `question_id` | UUID | UNIQUE FK → questions |
| `summary` | TEXT | NOT NULL |
| `highlights` | JSONB | `[{answer_id, highlight_text, difference_note}]` |
| `model_version` | TEXT | NOT NULL |
| `computed_at` | TIMESTAMPTZ | NOT NULL |

---

### 4B — Indexer Database (Indexer-managed)

These tables are **written exclusively by the Indexer service** (from on-chain events).
The API reads them; it never writes. Exception: the Key Service reads `post_access` for verification.

---

#### `chain_events`
Idempotency backbone. Every event processed by the Indexer is recorded here first.
If a row exists, the event is skipped (idempotent replay).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `chain_id` | INT | NOT NULL |
| `tx_hash` | TEXT | NOT NULL |
| `log_index` | INT | NOT NULL |
| `block_number` | BIGINT | NOT NULL |
| `block_hash` | TEXT | NOT NULL |
| `event_name` | TEXT | e.g. `QuestionCreated` |
| `event_payload` | JSONB | Raw decoded event data |
| `processed_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(chain_id, tx_hash, log_index)` ← **Invariant I5**

**Indexes**: `(chain_id, block_number)`, `(event_name)`

---

#### `failed_events`
Retry queue for events that failed during processing.

| Column | Type | Notes |
|--------|------|-------|
| `chain_id` | INT | PK (composite) |
| `tx_hash` | TEXT | PK (composite) |
| `log_index` | INT | PK (composite) |
| `block_number` | BIGINT | NOT NULL |
| `event_name` | TEXT | nullable |
| `event_payload` | JSONB | nullable |
| `error` | TEXT | NOT NULL, last error message |
| `retry_count` | INT | NOT NULL, default 0 |
| `last_retry_at` | TIMESTAMPTZ | nullable |
| `next_retry_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL |

---

#### `indexer_checkpoints`
Safe block tracking for reorg recovery and backfill.

| Column | Type | Notes |
|--------|------|-------|
| `chain_id` | INT | PK |
| `last_processed_block` | BIGINT | NOT NULL |
| `last_processed_block_hash` | TEXT | NOT NULL |
| `safe_block` | BIGINT | NOT NULL | N blocks behind (confirmed safe) |
| `safe_block_hash` | TEXT | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

---

#### `questions`
Bounty questions. Source of truth = contract; this is the read model.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `chain_id` | INT | NOT NULL |
| `onchain_question_id` | TEXT | NOT NULL (uint256 as text) |
| `asker_wallet` | TEXT | NOT NULL |
| `title` | TEXT | nullable (cached from CID) |
| `question_cid` | TEXT | nullable (IPFS CID) |
| `bounty_token` | TEXT | NOT NULL (ERC20 address) |
| `bounty_amount` | NUMERIC | NOT NULL |
| `deadline_at` | TIMESTAMPTZ | NOT NULL |
| `status` | ENUM | default `open` |
| `winner_answer_id` | UUID | FK → answers, nullable |
| `resolution_type` | TEXT | `winner_by_votes \| refunded \| treasury \| extended` |
| `payout_amount` | NUMERIC | nullable |
| `payout_token` | TEXT | nullable |
| `created_tx_hash` | TEXT | NOT NULL |
| `created_block_number` | BIGINT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `resolved_at` | TIMESTAMPTZ | nullable |

**Status values**: `open \| resolved \| expired \| refunded \| treasury \| extended`

**Constraints**: `UNIQUE(chain_id, onchain_question_id)`

**Invariant I6**: `status=resolved` only when `winner_answer_id` IS NOT NULL.
`status=refunded` when resolved with no winner.

**Indexes**: `(status, deadline_at)`, `(asker_wallet, created_at DESC)`

---

#### `answers`
Answers submitted to questions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `question_id` | UUID | FK → questions, NOT NULL |
| `chain_id` | INT | NOT NULL |
| `onchain_answer_id` | TEXT | NOT NULL |
| `answerer_wallet` | TEXT | NOT NULL |
| `answer_cid` | TEXT | IPFS CID (plaintext) |
| `status` | ENUM | default `submitted` (`submitted \| winner \| lost`) |
| `vote_count` | INT | default 0 (denormalized for fast sort) |
| `created_tx_hash` | TEXT | NOT NULL |
| `created_block_number` | BIGINT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(chain_id, onchain_answer_id)`

**Indexes**: `(question_id, vote_count DESC)`, `(question_id, created_at)`

---

#### `answer_votes`
Votes on answers. 1 wallet = 1 vote per question (enforced by DB constraint).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `question_id` | UUID | FK → questions, NOT NULL |
| `answer_id` | UUID | FK → answers, NOT NULL |
| `voter_wallet` | TEXT | NOT NULL |
| `direction` | ENUM | `up \| down` (downvote optional MVP) |
| `weight` | INT | default 1 (V2: stake-based) |
| `vote_tx_hash` | TEXT | NOT NULL |
| `vote_block_number` | BIGINT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(question_id, voter_wallet)` ← **Invariant I7**

**Indexes**: `(answer_id)`, `(question_id)`

---

#### `payouts`
Payout records from resolved questions. Written from `QuestionResolved` event.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `chain_id` | INT | NOT NULL |
| `question_id` | UUID | FK → questions |
| `recipient_wallet` | TEXT | NOT NULL |
| `amount` | NUMERIC | NOT NULL |
| `token` | TEXT | NOT NULL |
| `payout_type` | TEXT | `winner \| refund \| platform_fee \| treasury` |
| `tx_hash` | TEXT | NOT NULL |
| `block_number` | BIGINT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(chain_id, tx_hash, payout_type)`

---

#### `posts`
Knowledge posts (free or premium). Registry of on-chain posts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `chain_id` | INT | NOT NULL |
| `onchain_post_id` | TEXT | NOT NULL |
| `creator_wallet` | TEXT | NOT NULL |
| `project_id` | UUID | FK → projects, nullable |
| `title` | TEXT | nullable (cached from CID) |
| `preview_excerpt` | TEXT | nullable (first ~200 chars for premium) |
| `preview_cid` | TEXT | nullable (plaintext preview CID) |
| `visibility` | ENUM | default `public` (`public \| unlisted \| hidden`) |
| `access_type` | ENUM | NOT NULL (`free \| premium`) |
| `price_amount` | NUMERIC | nullable (null if free) |
| `price_token` | TEXT | nullable (ERC20 address) |
| `current_revision_id` | UUID | FK → post_revisions, nullable initially |
| `is_suspended` | BOOL | default false (admin moderation flag) |
| `created_tx_hash` | TEXT | NOT NULL |
| `created_block_number` | BIGINT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(chain_id, onchain_post_id)`

**Invariant I1**: `current_revision_id` always points to the latest **confirmed** revision.
Set by Indexer when it processes `PostCreated` and subsequently each `PostEdited`.

**Indexes**: `(creator_wallet, created_at DESC)`, `(access_type, visibility, created_at DESC)`,
`(project_id)`

---

#### `post_revisions`
Immutable revision history. Each `PostCreated` → rev=1; each `PostEdited` → new rev.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `post_id` | UUID | FK → posts, NOT NULL |
| `revision_number` | INT | NOT NULL, starts at 1 |
| `content_cid` | TEXT | NOT NULL (free: plaintext CID; premium: ciphertext CID) |
| `content_format` | ENUM | `md \| json \| html` |
| `is_encrypted` | BOOL | NOT NULL, default false |
| `encryption_alg` | TEXT | nullable (`xchacha20poly1305`) |
| `content_sha256` | TEXT | nullable (integrity check) |
| `editor_wallet` | TEXT | nullable (who published this revision) |
| `created_tx_hash` | TEXT | nullable (from `PostEdited`) |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(post_id, revision_number)`

**Invariant I2**: For premium posts, `is_encrypted = true` on ALL revisions.

---

#### `post_access`
Buyer access records. Written only by Indexer after N confirmations of `AccessPurchased`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `post_id` | UUID | FK → posts, NOT NULL |
| `chain_id` | INT | NOT NULL |
| `buyer_wallet` | TEXT | NOT NULL |
| `status` | ENUM | `pending \| confirmed \| reverted` |
| `purchase_tx_hash` | TEXT | NOT NULL |
| `purchase_block_number` | BIGINT | NOT NULL |
| `log_index` | INT | NOT NULL |
| `price_amount` | NUMERIC | nullable |
| `price_token` | TEXT | nullable |
| `confirmed_at` | TIMESTAMPTZ | nullable |
| `reverted_at` | TIMESTAMPTZ | nullable |

**Constraints**:
- `UNIQUE(post_id, buyer_wallet)` — one active access per buyer per post
- `UNIQUE(chain_id, purchase_tx_hash, log_index)` — idempotency

**Invariant I3**: `status=confirmed` only after N block confirmations.

**Indexes**: `(buyer_wallet, status)`, `(post_id, status)`

---

#### `contributions`
Proof-of-work receipts submitted to a post.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `post_id` | UUID | FK → posts, NOT NULL |
| `chain_id` | INT | NOT NULL |
| `onchain_contribution_id` | TEXT | NOT NULL |
| `contributor_wallet` | TEXT | NOT NULL |
| `kind` | ENUM | `edit \| research \| code \| translation \| other` |
| `artifact_cid` | TEXT | NOT NULL (IPFS CID of proof artifact) |
| `description` | TEXT | nullable (off-chain summary, API-writable) |
| `status` | ENUM | `submitted \| accepted \| rejected` |
| `share_bps` | INT | nullable, 0–10000, set on accept |
| `reviewed_by_wallet` | TEXT | nullable |
| `submitted_tx_hash` | TEXT | NOT NULL |
| `accepted_tx_hash` | TEXT | nullable |
| `submitted_block_number` | BIGINT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(chain_id, onchain_contribution_id)`

**Indexes**: `(post_id, status)`, `(contributor_wallet, status)`

---

#### `revenue_recipients`
Materialized revenue share per post. Must always sum to 10000 bps per post.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `post_id` | UUID | FK → posts, NOT NULL |
| `wallet` | TEXT | NOT NULL |
| `share_bps` | INT | NOT NULL, 0–10000 |
| `source` | ENUM | `creator \| contribution \| platform` |

**Constraints**: `UNIQUE(post_id, wallet)`

**Invariant I4**: `SUM(share_bps) WHERE post_id = X` = **10000** exactly.

Initial split on `PostCreated`:
- Creator: `10000 - platform_fee_bps` (e.g., 9500)
- Platform: `platform_fee_bps` (e.g., 500)

On each `ContributionAccepted`:
- Contributor gets `shareBps` from creator's share
- Creator's new share = old_creator_share - shareBps
- Total still = 10000

---

#### `revenue_splits_snapshots`
Audit trail: captures state of `revenue_recipients` after every change.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `post_id` | UUID | FK → posts, NOT NULL |
| `split_version` | INT | NOT NULL, auto-increments per post |
| `recipients` | JSONB | `[{wallet, share_bps, source}]` snapshot |
| `triggered_by` | TEXT | `ContributionAccepted \| manual` |
| `tx_hash` | TEXT | nullable |
| `block_number` | BIGINT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(post_id, split_version)`

---

#### `withdrawals`
Pull payment withdrawal records. Written from on-chain Withdraw events.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `chain_id` | INT | NOT NULL |
| `post_id` | UUID | FK → posts, nullable (Q&A payouts have no post_id) |
| `recipient_wallet` | TEXT | NOT NULL |
| `amount` | NUMERIC | NOT NULL |
| `token` | TEXT | NOT NULL |
| `tx_hash` | TEXT | NOT NULL |
| `block_number` | BIGINT | NOT NULL |
| `log_index` | INT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Constraints**: `UNIQUE(chain_id, tx_hash, log_index)`

**Indexes**: `(recipient_wallet, created_at DESC)` — for earnings history

---

## 5. Use Case Flows

Each flow describes: **actors**, **preconditions**, **step-by-step sequence**,
**entities touched**, **failure modes**, and **invariants checked**.

---

### 5.1 Authentication Flows

#### UC-Auth-1 — Guest connects wallet

**Actors**: Guest → Normal User
**Preconditions**: Browser wallet (MetaMask, Coinbase Wallet, etc.) installed

**Flow**:
1. Guest clicks "Connect Wallet" in the UI
2. Browser wallet prompts to approve connection
3. Frontend receives `wallet_address`
4. Frontend calls `GET /users/:wallet` to check if profile exists
5. If not exists: auto-create `users` row with `wallet_address`
6. Frontend shows connected state

**Entities touched**: `users` (read + conditional create)

---

#### UC-Auth-2 — Sign-in via wallet signature challenge

**Actors**: Connected wallet user
**Preconditions**: Wallet is connected

**Flow**:
1. Frontend calls `POST /auth/nonce` with `{wallet_address}`
2. API creates `auth_nonces` row → returns `nonce` (UUID)
3. Frontend asks wallet to sign: `EIP-191("KnowMarket login: {nonce}")`
4. Wallet returns `signature`
5. Frontend calls `POST /auth/verify` with `{wallet, nonce, signature}`
6. API:
   - Looks up `auth_nonces` row: must exist, not expired, not used
   - Recovers address from signature using EIP-191
   - Checks recovered address == `wallet` (case-insensitive)
   - Sets `auth_nonces.used_at = NOW()` (marks consumed)
   - Creates `user_sessions` row
   - Issues JWT with `{sub: user_id, jti: session_id, wallet, exp}`
7. Frontend stores JWT, uses it for all authenticated requests

**Entities touched**: `auth_nonces` (insert → mark used), `users` (read), `user_sessions` (insert)

**Failure modes**:
- Nonce expired (>5 min) → `401 Nonce expired`, create new one
- Nonce already used → `401 Nonce already used` (replay attack blocked)
- Signature mismatch → `401 Signature invalid`

---

#### UC-Auth-3 — Update profile

**Actors**: Authenticated user
**Preconditions**: Valid JWT

**Flow**:
1. User submits `PATCH /users/me` with `{handle?, avatar_cid?, bio?}`
2. API validates handle uniqueness
3. Updates `users` row

**Entities touched**: `users` (update)

---

### 5.2 Q&A Flows

#### UC-QA-1 — Browse questions feed

**Actors**: Guest or User
**Flow**:
1. Frontend calls `GET /questions?status=open&tag=blockchain&sort=deadline&page=1`
2. API queries `questions` joined with `answer_votes` aggregates, `question_tags`, `tags`
3. Returns paginated list with: title, bounty, deadline, answer count, top vote count

**Entities read**: `questions`, `answers` (count), `answer_votes` (aggregate), `question_tags`, `tags`

---

#### UC-QA-3 — Create question (lock bounty)

**Actors**: Asker (authenticated user with ERC20 balance)
**Preconditions**: Signed-in, `bounty_amount >= min_bounty` (from `platform_config`)

**Flow**:
```
1. Asker drafts title + body + tags in FE
2. FE uploads content JSON → IPFS → questionCid
3. FE calls ERC20.approve(QnA_contract, bounty_amount)
   → UX state: idle → approving
4. FE calls QnA_contract.createQuestion(bountyToken, bountyAmount, questionCid, deadline)
   → UX state: approving → tx_pending
5. Contract: transferFrom(asker, contract) → escrow
   → emits QuestionCreated(questionId, asker, bountyToken, bountyAmount, questionCid, deadline)
6. Indexer receives QuestionCreated
   → checks chain_events: UNIQUE(chain_id, tx_hash, log_index) — skip if seen
   → waits N confirmations
   → inserts chain_events
   → upserts questions(status=open, bounty_locked, deadline_at)
   → UX state: tx_pending → indexer_pending → confirmed
7. API/WS pushes "question confirmed" notification
8. FE tags: API writes question_tags rows
9. Stats update: user_stats.questions_asked++
```

**Entities written**:
- `chain_events` (Indexer)
- `questions` (Indexer, status=open)
- `question_tags` (API, after confirmation)
- `user_stats` (async trigger: questions_asked++)
- `notifications` (for asker if question goes confirmed)

**Failure modes**:
- ERC20 approve fails → stay idle
- Tx reverted → show error, no indexer action
- IPFS upload fails → retry, don't submit tx until CID is available
- Indexer lag → FE shows `indexer_pending` until confirmed

---

#### UC-QA-4 — Submit answer (free)

**Actors**: Answerer (authenticated user)
**Preconditions**: Signed-in; question status = `open`; answerer ≠ asker (recommended check)

**Flow**:
```
1. Answerer writes answer in FE
2. FE uploads answer plaintext JSON → IPFS → answerCid
3. FE calls QnA_contract.submitAnswer(questionId, answerCid)
   → UX state: tx_pending
4. Contract emits AnswerSubmitted(questionId, answerId, answerer, answerCid)
5. Indexer: wait N confs → upsert answers(status=submitted)
6. Notify asker: "new answer on your question"
7. AI Service (async): recompute ai_rankings + ai_summaries for this question
8. Stats: user_stats.answers_submitted++
```

**Entities written**:
- `chain_events` (Indexer)
- `answers` (Indexer, status=submitted)
- `notifications` (for asker)
- `ai_rankings`, `ai_summaries` (AI Service, async)
- `user_stats` (answers_submitted++)

---

#### UC-QA-5 — Vote on answer

**Actors**: Voter (authenticated user; not the asker for that question, recommended)
**Preconditions**: Signed-in; question status = `open`; voter hasn't voted on this question

**Flow**:
```
1. Voter clicks upvote on answer in FE
2. FE calls QnA_contract.vote(questionId, answerId, direction=up)
3. Contract: checks UNIQUE(questionId, voter) on-chain → revert if duplicate
   → emits VoteCast(questionId, answerId, voter, weight=1, direction)
4. Indexer: wait N confs
   → INSERT answer_votes — blocked by UNIQUE(question_id, voter_wallet) if replay
   → UPDATE answers.vote_count++ (denormalized aggregate)
5. AI Service (async): recompute ai_rankings
6. Stats: user_stats.votes_cast++ for voter
```

**Entities written**:
- `chain_events` (Indexer)
- `answer_votes` (Indexer, with UNIQUE constraint enforcement — Invariant I7)
- `answers.vote_count` (Indexer, denormalized update)
- `ai_rankings` (AI Service, async)
- `user_stats` (votes_cast++)

**Failure mode**: If voter tries to vote twice, both contract AND DB constraint block it.

---

#### UC-QA-6 — Resolve after deadline + auto payout

**Actors**: Keeper bot OR any user (permissionless)
**Preconditions**: `question.deadline_at <= NOW()`, `question.status = open`

**Flow**:
```
1. Keeper/anyone calls QnA_contract.resolve(questionId) (permissionless after deadline)
2. Contract logic:
   a. If answers.maxVotes > 0:
      - winner = answer with highest vote_count (tie-break: earliest submitted)
      - transferEscrow → winner wallet
      - emit QuestionResolved(questionId, winnerAnswerId, winner, payoutToken, payoutAmount,
                              resolution=winner_by_votes)
   b. If answers.maxVotes == 0:
      - (per platform_config fallback rule): refund asker minus platform_fee
      - emit QuestionResolved(resolution=refunded, winner=address(0))
3. Indexer receives QuestionResolved:
   → UPDATE questions SET status=resolved, winner_answer_id=X, resolved_at=NOW()
     (or status=refunded if no winner)
   → UPDATE answers SET status=winner WHERE id=winnerAnswerId
   → UPDATE answers SET status=lost WHERE question_id=X AND id != winnerAnswerId
   → INSERT payouts (winner type + platform_fee type)
4. Notifications:
   → winner: "You won the bounty!"
   → asker: "Your question was resolved"
   → all voters: no notification (too noisy; optional)
5. Stats async update:
   → winner user_stats: answers_won++, bounty_earned+=amount
   → asker user_stats: questions_resolved_with_winner++
   → each voter: vote_accuracy_bps recomputed
6. Badge checks: first_bounty_win, expert_answerer for winner
7. Rankings update triggered
```

**Entities written**:
- `chain_events` (Indexer)
- `questions` (Indexer: status, winner_answer_id, resolved_at) — Invariant I6
- `answers` (Indexer: status=winner/lost)
- `payouts` (Indexer)
- `notifications` (winner, asker)
- `user_stats` (answers_won, bounty_earned, vote_accuracy_bps for all voters)
- `user_badges` (if badge conditions met)
- `user_rankings` (triggered refresh)

**Invariant I6**: `questions.status=resolved` ↔ `winner_answer_id IS NOT NULL`.
`questions.status=refunded` ↔ `winner_answer_id IS NULL`.

---

#### UC-QA-7 — AI assists with answer ranking (UX-only)

**Actors**: AI Service (background, triggered by new answers/votes)
**Rule**: AI reads DB, writes `ai_rankings` and `ai_summaries`. **Never writes to** `questions`, `answers`, `answer_votes`, or anything that influences payouts.

**Flow**:
```
1. AI Service reads answers + answer_votes for a question
2. Scores each answer (quality, clarity, completeness)
3. Writes ai_rankings (score, rank_position, reason)
4. Writes ai_summaries (summary, highlights with differences)
5. FE fetches AI outputs for display — clearly labeled "AI suggested ranking"
```

**Entities written**: `ai_rankings`, `ai_summaries` (AI Service only)

**Entities read**: `answers` (answer_cid → fetch from IPFS), `answer_votes`

---

### 5.3 Content / Post Flows

#### UC-Post-3 — Create free post

**Actors**: Creator (authenticated user)
**Flow**:
```
1. Creator writes title + body (markdown) + tags
2. FE uploads content.json → IPFS → contentCid (plaintext)
3. FE calls Content_contract.createPost(isPremium=false, price=0, contentCid, previewCid="")
4. Contract emits PostCreated(postId, creator, accessType=free, priceToken, priceAmount,
                              contentCid, previewCid)
5. Indexer: wait N confs
   → INSERT posts(access_type=free, creator_wallet, onchain_post_id)
   → INSERT post_revisions(revision_number=1, content_cid, is_encrypted=false)
   → UPDATE posts SET current_revision_id = new_revision.id  ← Invariant I1
   → INSERT revenue_recipients: creator gets (10000 - platform_fee_bps), platform gets platform_fee_bps
   → INSERT revenue_splits_snapshots(version=1, recipients=[...])
6. API writes post_tags
7. Stats: posts_created++
```

**Entities written**:
- `chain_events`, `posts`, `post_revisions` (Indexer)
- `revenue_recipients`, `revenue_splits_snapshots` (Indexer)
- `post_tags` (API)
- `user_stats` (posts_created++)

---

#### UC-Post-4 — Create premium post (encrypted)

**Actors**: Creator (authenticated user)
**Preconditions**: Signed-in; content prepared

**Flow**:
```
1. Creator writes content.json (title, body_md, tags, attachments)
2. FE generates contentKey (32-byte random symmetric key)
3. FE encrypts content.json → XChaCha20-Poly1305 → {alg, nonce, ciphertext, aad, schema_version=1}
4. FE uploads ciphertext JSON → IPFS → cipherCid
5. FE calls POST /keys/store {chainId, postId_pending, contentKey}
   → API/Key Service: encrypt contentKey at rest → INSERT content_keys
   Note: postId_pending is used before on-chain tx, linked after confirmation
6. FE optionally uploads preview (plaintext excerpt) → IPFS → previewCid
7. FE calls Content_contract.createPost(isPremium=true, price, token, cipherCid, previewCid)
8. Contract emits PostCreated(postId, creator, accessType=premium, price, cipherCid, previewCid)
9. Indexer: wait N confs
   → INSERT posts(access_type=premium)
   → INSERT post_revisions(revision_number=1, content_cid=cipherCid, is_encrypted=true,
                            encryption_alg='xchacha20poly1305')  ← Invariant I2
   → UPDATE posts SET current_revision_id = new_revision.id  ← Invariant I1
   → INSERT revenue_recipients (creator + platform)
   → INSERT revenue_splits_snapshots
10. Stats: posts_created++, premium_posts_created++
```

**Invariant I2**: Premium posts MUST have `is_encrypted=true` on all revisions.

---

#### UC-Post-5 — Edit post (new revision)

**Actors**: Post Owner (creator)
**Preconditions**: Signed-in; owns the post

**Flow**:
```
1. Creator writes updated content, re-encrypts if premium
2. FE uploads new CID to IPFS
3. FE calls Content_contract.editPost(postId, newContentCid)
4. Contract emits PostEdited(postId, editor, newContentCid, revision=N+1)
5. Indexer:
   → INSERT post_revisions(revision_number=N+1, content_cid=newCid)
   → UPDATE posts SET current_revision_id = new_revision.id  ← Invariant I1
```

**Entities written**: `chain_events`, `post_revisions` (new row), `posts.current_revision_id`

---

#### UC-Post-6 — Purchase access to premium post

**Actors**: Buyer (authenticated user)
**Preconditions**: Signed-in; post is premium; buyer has ERC20 balance + allowance

**Flow**:
```
1. Buyer clicks "Purchase Access"
2. FE calls ERC20.approve(Content_contract, price_amount)
   → UX: idle → approving
3. FE calls Content_contract.purchaseAccess(postId)
   → UX: approving → tx_pending
4. Contract: transferFrom(buyer, contract) → revenue escrow
   → emits AccessPurchased(postId, buyer, priceToken, priceAmount)
5. Indexer: receive AccessPurchased
   → INSERT post_access(status=pending)
   → wait N=12 confirmations
   → UPDATE post_access SET status=confirmed, confirmed_at=NOW()  ← Invariant I3
   → UX: tx_pending → indexer_pending → confirmed
6. WebSocket push: "Access confirmed for post X"
7. Notification to creator: "New buyer for your post"
8. Stats async: creator user_stats.total_unique_buyers++ (if buyer != creator)
               creator user_stats.revenue_earned+=price
```

**Entities written**:
- `chain_events`, `post_access` (Indexer: pending → confirmed) — Invariant I3
- `notifications` (buyer: access_confirmed; creator: new_buyer)
- `user_stats` (creator: revenue_earned, total_unique_buyers)

**Failure mode — reorg**:
- Block reorganization detected → Indexer sets `post_access.status=reverted`
- Key Service will deny key if access is reverted
- Notify buyer: "Your purchase was reverted (blockchain reorganization)"

---

#### UC-Post-7 — Read premium post (request key + decrypt)

**Actors**: Buyer with confirmed access
**Preconditions**: `post_access.status=confirmed` for (post_id, buyer_wallet)

**Flow**:
```
1. Buyer opens premium post detail page
2. FE calls POST /auth/key-nonce {postId, wallet}
   → API creates key_request_nonces row → returns nonce UUID
3. Buyer's wallet signs: sign(EIP-191("KnowMarket key: {nonce}"))
4. FE calls POST /keys/request {postId, chainId, wallet, nonce, signature}
5. Key Service (inside API):
   a. Look up key_request_nonces: must exist, not expired, not used
   b. Recover address from signature: must match wallet
   c. Mark nonce as used
   d. Check post_access WHERE post_id=X AND buyer_wallet=wallet AND status=confirmed
      → If not found: fallback → call Content_contract.hasAccess(postId, wallet) on-chain
   e. If access confirmed: look up content_keys by (chain_id, onchain_post_id)
   f. Decrypt the stored encrypted_key → return contentKey (MVP: plaintext; V2: encrypted-to-buyer)
   g. Log: {postId, wallet, request_id, result=success} — NEVER log plaintext key
6. FE receives contentKey
7. FE fetches ciphertext from IPFS (using CID from post_revisions.content_cid)
8. FE decrypts: XChaCha20-Poly1305.decrypt(ciphertext, nonce, contentKey)
9. FE renders decrypted content.json (title, body_md, attachments)
```

**Entities read**:
- `key_request_nonces` (read + mark used)
- `post_access` (verify confirmed)
- `content_keys` (retrieve encrypted key)
- `post_revisions` (get ciphertext CID)

**Entities written**: `key_request_nonces.used_at`

**Security invariants**:
- Nonce: single-use (used_at prevents replay)
- Signature: EIP-191 prevents impersonation
- DB check first (fast path), chain fallback (safety net)
- Key Service logs never contain plaintext keys

---

### 5.4 Contribution Marketplace Flows

#### UC-Contrib-1 — Submit contribution

**Actors**: Contributor (authenticated user)
**Preconditions**: Signed-in; target post exists; contribution_policy != `closed`

**Flow**:
```
1. Contributor uploads artifact (diff/notes/file) → IPFS → artifactCid
2. (Optional) Contributor writes description in API (off-chain, not on-chain)
3. FE calls Content_contract.submitContribution(postId, artifactCid, kind)
4. Contract emits ContributionSubmitted(postId, contributionId, contributor, kind, artifactCid)
5. Indexer: wait N confs
   → INSERT contributions(status=submitted, artifact_cid, kind)
6. Notification to post owner/project owner: "New contribution submitted"
7. Stats: user_stats.contributions_submitted++
```

**Entities written**:
- `chain_events`, `contributions` (Indexer)
- `notifications` (post owner)
- `user_stats` (contributions_submitted++)

---

#### UC-Contrib-3 — Accept contribution + assign revenue share

**Actors**: Post Owner OR designated Reviewer
**Preconditions**: Contribution status = `submitted`; post owner/reviewer auth verified

**Flow**:
```
1. Owner/Reviewer reviews artifact CID (fetch from IPFS)
2. Owner calls Content_contract.acceptContribution(postId, contributionId, shareBps)
   → Contract validates: sum of existing shares + shareBps <= 10000 - platform_fee_bps - min_creator_share
   → emits ContributionAccepted(postId, contributionId, acceptedBy, shareBps)
3. Indexer:
   → UPDATE contributions SET status=accepted, share_bps=shareBps, reviewed_by_wallet=acceptedBy
   → UPDATE revenue_recipients:
      - INSERT or UPDATE contributor row: (post_id, wallet=contributor, share_bps=shareBps, source=contribution)
      - UPDATE creator row: share_bps -= shareBps  ← maintains SUM=10000 (Invariant I4)
   → Increment split_version
   → INSERT revenue_splits_snapshots(split_version++, recipients=[...snapshot])
4. Notification to contributor: "Your contribution was accepted! You earn X bps of revenue"
5. Stats: contributor user_stats.contributions_accepted++
6. Badge check: top_contributor if contributions_accepted >= 5
```

**Entities written**:
- `chain_events`, `contributions` (Indexer)
- `revenue_recipients` (Indexer: recalculate) — Invariant I4
- `revenue_splits_snapshots` (Indexer: new snapshot)
- `notifications` (contributor)
- `user_stats` (contributions_accepted++)
- `user_badges` (conditional)

**Invariant I4**: After every `ContributionAccepted`, re-verify `SUM(share_bps) = 10000` for that post.

---

#### UC-Contrib-4 — Reject contribution

**Actors**: Post Owner OR Reviewer

**Flow**:
```
1. Owner/Reviewer reviews artifact and decides to reject
2. On-chain rejection (optional for MVP; off-chain reject also viable)
   OR API call: PATCH /contributions/:id { status: rejected }
3. Indexer (if on-chain) OR API (if off-chain):
   → UPDATE contributions SET status=rejected
4. Notification to contributor: "Your contribution was not accepted"
   (no change to revenue_recipients)
```

---

#### UC-Contrib-6 — Withdraw earnings (pull-payment)

**Actors**: Any revenue recipient (creator, contributor, platform)
**Preconditions**: Has claimable balance in contract

**Flow**:
```
1. Recipient calls Content_contract.withdraw(postId) (pull-payment)
2. Contract transfers accumulated share → recipient wallet
   → emits WithdrawalCompleted(postId, recipient, amount, token)
3. Indexer:
   → INSERT withdrawals(post_id, recipient_wallet, amount, token)
4. Notification to recipient: "Withdrawal completed"
5. Stats: update revenue totals
```

**Entities written**: `chain_events`, `withdrawals` (Indexer), `notifications`

---

### 5.5 Profile & Ranking Flows

#### UC-Profile-1 — View creator profile

**Actors**: Any user (public view)

**Flow**:
```
GET /users/:wallet/profile
→ API joins:
   - users (handle, avatar, bio)
   - user_stats (posts_created, revenue_earned, total_buyers)
   - user_rankings (overall rank, creator rank)
   - user_badges
   - posts (recent, public only) + post_tags
→ Returns public profile page
```

**Entities read**: `users`, `user_stats`, `user_rankings`, `user_badges`, `posts`, `post_tags`

---

#### UC-Profile-2 — View contributor portfolio

**Actors**: Any user (public view)

**Flow**:
```
GET /users/:wallet/contributions
→ API returns:
   - contributions WHERE contributor_wallet=wallet AND status=accepted
   - For each: artifact_cid, post title, share_bps, earned amount
   - user_stats.contributions_accepted, contribution_revenue_earned
```

---

#### UC-Profile-3 — Q&A stats

**Actors**: Any user

**Flow**:
```
GET /users/:wallet/qa-stats
→ API returns:
   - questions_asked, questions_resolved_with_winner
   - answers_submitted, answers_won
   - bounty_earned, bounty_spent
   - vote_accuracy_bps
   - Recent answered questions (won + others)
```

---

#### UC-Rank-1 — View leaderboard

**Actors**: Any user (public)

**Flow**:
```
GET /leaderboard?category=overall&period=monthly&page=1
→ API queries user_rankings WHERE category=X AND period=Y ORDER BY rank_pos ASC
→ Joins users for handle/avatar
→ Returns top N ranked users with scores
```

---

### 5.6 Admin & Moderation Flows

#### UC-Admin-1 — Review abuse reports

**Actors**: Moderator or Admin

**Flow**:
```
1. GET /admin/reports?status=pending
   → returns reports joined with reporter user, entity details
2. Moderator reviews report
3. PATCH /admin/reports/:id {action: 'actioned' | 'dismissed', reason}
   → IF actioned: hide content (posts.is_suspended=true OR questions flagged)
   → INSERT admin_actions(actor=moderator, action='dismiss_report'/'hide_post', ...)
   → UPDATE reports SET status=actioned|dismissed, reviewed_by=moderator_id
```

**Entities written**: `reports`, `admin_actions`, conditionally `posts.is_suspended`

---

#### UC-Admin-2 — Manage user roles

**Actors**: Admin

**Flow**:
```
1. POST /admin/users/:wallet/roles {role: 'moderator', action: 'grant'}
2. API checks requesting user IS admin
3. INSERT user_roles(user_id, role='moderator', granted_by=admin_id)
4. INSERT admin_actions(action='grant_role', target_type='user', ...)
```

**Entities written**: `user_roles`, `admin_actions`

---

#### UC-Admin-3 — Update platform config

**Actors**: Admin

**Flow**:
```
1. PATCH /admin/config {key: 'platform_fee_bps', value: '300'}
2. UPDATE platform_config SET value=X, updated_by=admin_id, updated_at=NOW()
3. INSERT admin_actions (for audit)
```

**Note**: Config changes do NOT retroactively affect existing revenue splits.
Only new posts created after the config change use the new `platform_fee_bps`.

---

### 5.7 Indexer Ops Flows

#### UC-Ops-1 — Backfill / reindex from block range

**Flow**:
```
./indexer backfill --chain-id=8453 --from-block=N --to-block=M

For each block in [N, M]:
  → Fetch all logs from chain
  → For each log:
      Check chain_events UNIQUE(chain_id, tx_hash, log_index) → skip if exists
      Process event → upsert target tables
      Insert chain_events (idempotent)
→ Update indexer_checkpoints
```

**Entities touched**: `chain_events`, all event-target tables, `indexer_checkpoints`

---

#### UC-Ops-2 — Handle reorg

**Flow**:
```
Indexer detects block hash mismatch at block N:
1. Mark all chain_events WHERE block_number >= N as potentially reverted
2. For affected rows:
   - post_access: status=reverted
   - questions/answers: mark as reverted
   - contributions: mark reverted
3. Set indexer_checkpoints.safe_block to block N-1
4. Backfill from N to current tip
5. Reprocess correct chain state
```

**Entities touched**: `indexer_checkpoints`, `chain_events`, `post_access`, `questions`, `answers`

---

## 6. Event → DB Mapping (Complete)

| Smart Contract Event | chain_events | Primary Tables | Secondary Effects |
|---------------------|-------------|----------------|-------------------|
| `QuestionCreated` | ✓ | `questions` (insert, status=open) | `notifications` (async) |
| `AnswerSubmitted` | ✓ | `answers` (insert) | `ai_rankings` trigger, `notifications` |
| `VoteCast` | ✓ | `answer_votes` (insert), `answers.vote_count` (++) | `ai_rankings` trigger |
| `QuestionResolved` | ✓ | `questions` (resolved/refunded), `answers` (winner/lost), `payouts` (insert) | `notifications`, `user_stats`, `user_badges`, `user_rankings` |
| `PostCreated` | ✓ | `posts` (insert), `post_revisions` (rev=1), `revenue_recipients` (init), `revenue_splits_snapshots` (v1) | `user_stats` (posts_created++) |
| `PostEdited` | ✓ | `post_revisions` (new rev), `posts.current_revision_id` (update) | |
| `AccessPurchased` | ✓ | `post_access` (pending → confirmed after N blocks) | `notifications`, `user_stats` (revenue, buyers) |
| `ContributionSubmitted` | ✓ | `contributions` (insert, status=submitted) | `notifications` (post owner) |
| `ContributionAccepted` | ✓ | `contributions` (accepted, share_bps), `revenue_recipients` (recalculate), `revenue_splits_snapshots` (new snapshot) | `notifications`, `user_stats`, `user_badges` |
| `WithdrawalCompleted` | ✓ | `withdrawals` (insert) | `notifications` |

---

## 7. Database Invariants

| # | Rule | Enforced by |
|---|------|------------|
| **I1** | `posts.current_revision_id` always points to the latest **confirmed** revision | Indexer (set on PostCreated + PostEdited) |
| **I2** | Premium post: ALL `post_revisions.is_encrypted = true` | Indexer (validates on insert) |
| **I3** | `post_access.status = confirmed` only after N block confirmations | Indexer (confirmation counter) |
| **I4** | `SUM(revenue_recipients.share_bps) = 10000` per `post_id` exactly | Indexer (recalculates on each ContributionAccepted) + periodic validation job |
| **I5** | Indexer idempotency: `UNIQUE(chain_id, tx_hash, log_index)` in `chain_events` | DB constraint |
| **I6** | `questions.status = resolved` ↔ `winner_answer_id IS NOT NULL`. `status = refunded` ↔ `winner_answer_id IS NULL` | Indexer (set together in same tx) |
| **I7** | `UNIQUE(question_id, voter_wallet)` — 1 vote per wallet per question | DB constraint (UNIQUE) |
| **I8** | `content_keys` never stores plaintext keys. Key encrypted at rest with AES-256-GCM | Key Service (encrypt before insert) |
| **I9** | `auth_nonces` and `key_request_nonces` are single-use: `used_at` non-null = consumed | API (set used_at atomically) |
| **I10** | AI Service has **zero** write access to `questions`, `answers`, `answer_votes`, `payouts`, `post_access` | Architecture boundary (read-only DB user for AI service) |
| **I11** | `contributions.share_bps` is set **only** when `status = accepted` | Indexer + application validation |
| **I12** | `revenue_recipients.share_bps` per recipient: `creator_share_bps >= creator_min_share_bps` (from platform_config) | Validated on-chain before ContributionAccepted |

---

## 8. Writers Map

| Table | Written by | Read by |
|-------|-----------|---------|
| `users` | API | API, AI Service |
| `user_roles` | API (admin only) | API |
| `user_sessions` | API | API |
| `auth_nonces` | API | API |
| `content_keys` | API (Key Service) | API (Key Service) |
| `key_request_nonces` | API (Key Service) | API (Key Service) |
| `projects` | API | API, Indexer (FK lookup) |
| `project_reviewers` | API | API |
| `user_stats` | Background job (triggered by Indexer events) | API |
| `user_rankings` | Background job | API |
| `user_badges` | Background job | API |
| `tags` | API | API |
| `question_tags` | API | API |
| `post_tags` | API | API |
| `notifications` | API + Indexer event hooks | API |
| `reports` | API (users submit) + Moderators (update) | API |
| `admin_actions` | API (admin/moderator) | API |
| `platform_config` | API (admin only) | API, Indexer |
| `ai_rankings` | AI Service | API |
| `ai_summaries` | AI Service | API |
| `chain_events` | **Indexer only** | Indexer, API (debugging) |
| `failed_events` | **Indexer only** | Indexer, Ops tooling |
| `indexer_checkpoints` | **Indexer only** | Indexer, Ops tooling |
| `questions` | **Indexer only** | API, AI Service |
| `answers` | **Indexer only** | API, AI Service |
| `answer_votes` | **Indexer only** | API, AI Service |
| `payouts` | **Indexer only** | API |
| `posts` | **Indexer only** | API, AI Service, Key Service |
| `post_revisions` | **Indexer only** | API, Key Service |
| `post_access` | **Indexer only** | API, Key Service |
| `contributions` | **Indexer only** | API |
| `revenue_recipients` | **Indexer only** | API |
| `revenue_splits_snapshots` | **Indexer only** | API |
| `withdrawals` | **Indexer only** | API |

---

## 9. Entity Relationship Summary

```
[projects] ──owner_id──> [users]
[projects] <──project_id── [posts]
[project_reviewers] ──project_id──> [projects]
[project_reviewers] ──reviewer_id──> [users]

[users] <──asker_wallet── [questions]
[questions] <──question_id── [answers]
[questions] <──question_id── [answer_votes]
[answers] <──answer_id── [answer_votes]
[questions] ──winner_answer_id──> [answers]
[questions] <──question_id── [payouts]

[posts] ──current_revision_id──> [post_revisions]
[post_revisions] ──post_id──> [posts]
[posts] <──post_id── [post_access]
[posts] <──post_id── [contributions]
[posts] <──post_id── [revenue_recipients]
[posts] <──post_id── [revenue_splits_snapshots]
[posts] <──post_id── [withdrawals]

[chain_events] (idempotency ledger — referenced by all indexer writes)
[failed_events] ── retry queue for chain_events that failed processing

[content_keys] ── keyed by (chain_id, onchain_post_id) → linked to [posts]
[auth_nonces] ── wallet challenge, consumed on /auth/verify
[key_request_nonces] ── key challenge, consumed on /keys/request

[user_stats] ──user_id──> [users]  (materialized, computed from above)
[user_rankings] ──user_id──> [users] (computed from user_stats)
[user_badges] ──user_id──> [users] (awarded when thresholds met)

[ai_rankings] ──question_id──> [questions], ──answer_id──> [answers]
[ai_summaries] ──question_id──> [questions]

[tags] <── [question_tags] ──> [questions]
[tags] <── [post_tags] ──> [posts]

[notifications] ──user_id──> [users]
[reports] ──reporter_id──> [users]
[admin_actions] ──actor_id──> [users]
[user_roles] ──user_id──> [users]
[user_sessions] ──user_id──> [users]
```

### Total entity count
| Category | Count |
|----------|-------|
| BE-managed (API writes) | 20 tables |
| Indexer-managed (Indexer writes) | 14 tables |
| **Total** | **34 tables** |

### Migration order (respects FK dependencies)
```
1.  tags
2.  users
3.  user_roles
4.  user_sessions
5.  auth_nonces
6.  platform_config
7.  projects
8.  project_reviewers
9.  indexer_checkpoints
10. chain_events
11. failed_events
12. questions
13. answers                  (FK → questions)
14. answer_votes             (FK → questions, answers)
15. payouts                  (FK → questions)
16. posts                    (no current_revision_id FK yet — circular)
17. post_revisions           (FK → posts)
18. posts ALTER ADD FK       (posts.current_revision_id → post_revisions)
19. post_access              (FK → posts)
20. contributions            (FK → posts)
21. revenue_recipients       (FK → posts)
22. revenue_splits_snapshots (FK → posts)
23. withdrawals              (FK → posts)
24. content_keys
25. key_request_nonces
26. user_stats               (FK → users)
27. user_rankings            (FK → users)
28. user_badges              (FK → users)
29. question_tags            (FK → questions, tags)
30. post_tags                (FK → posts, tags)
31. notifications            (FK → users)
32. reports                  (FK → users)
33. admin_actions            (FK → users)
34. ai_rankings              (FK → questions, answers)
35. ai_summaries             (FK → questions)
```




## Result 

