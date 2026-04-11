# KnowMarket — ERD Analysis & Relationship Explanation

> Full scan of all 34 entities, every relationship type, and how each relationship
> activates during each use-case flow.

---

## Table of Contents

1. [Entity Clusters Overview](#1-entity-clusters-overview)
2. [Full ERD (Mermaid)](#2-full-erd-mermaid)
3. [Relationship Type Catalog](#3-relationship-type-catalog)
4. [Cluster-by-Cluster Relationship Explanation](#4-cluster-by-cluster-relationship-explanation)
   - [4.1 Identity & Auth Cluster](#41-identity--auth-cluster)
   - [4.2 Q&A Loop Cluster](#42-qa-loop-cluster)
   - [4.3 Content & Paywall Cluster](#43-content--paywall-cluster)
   - [4.4 Contribution & Revenue Cluster](#44-contribution--revenue-cluster)
   - [4.5 Indexer Infrastructure Cluster](#45-indexer-infrastructure-cluster)
   - [4.6 Reputation & Ranking Cluster](#46-reputation--ranking-cluster)
   - [4.7 Platform Ops Cluster](#47-platform-ops-cluster)
5. [Special Relationship Patterns](#5-special-relationship-patterns)
   - [5.1 Wallet-based loose joins](#51-wallet-based-loose-joins)
   - [5.2 Polymorphic references](#52-polymorphic-references)
   - [5.3 Circular FK (posts ↔ post_revisions)](#53-circular-fk-posts--post_revisions)
   - [5.4 Materialized aggregates (user_stats)](#54-materialized-aggregates-user_stats)
6. [Flow-Based ERD Walkthroughs](#6-flow-based-erd-walkthroughs)
   - [6.1 Q&A full lifecycle](#61-qa-full-lifecycle)
   - [6.2 Premium content lifecycle](#62-premium-content-lifecycle)
   - [6.3 Contribution marketplace lifecycle](#63-contribution-marketplace-lifecycle)
   - [6.4 Auth & key delivery lifecycle](#64-auth--key-delivery-lifecycle)
7. [Cross-Domain Relationships](#7-cross-domain-relationships)
8. [Relationship Summary Table](#8-relationship-summary-table)

---

## 1. Entity Clusters Overview

The 34 tables group into 7 natural clusters. Understanding the cluster boundaries
first makes individual relationships much clearer.

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLUSTER 1: Identity & Auth              CLUSTER 6: Reputation      │
│  users, user_roles, user_sessions,       user_stats, user_rankings, │
│  auth_nonces                             user_badges                 │
├────────────────────────┬────────────────────────────────────────────┤
│  CLUSTER 2: Q&A Loop   │  CLUSTER 3: Content & Paywall              │
│  questions, answers,   │  projects, project_reviewers,              │
│  answer_votes, payouts │  posts, post_revisions, post_access,       │
│  ai_rankings,          │  content_keys, key_request_nonces          │
│  ai_summaries          │                                            │
├────────────────────────┴────────────────────────────────────────────┤
│  CLUSTER 4: Contribution & Revenue                                  │
│  contributions, revenue_recipients, revenue_splits_snapshots,       │
│  withdrawals                                                        │
├─────────────────────────────────────────────────────────────────────┤
│  CLUSTER 5: Indexer Infrastructure                                  │
│  chain_events, failed_events, indexer_checkpoints                   │
├─────────────────────────────────────────────────────────────────────┤
│  CLUSTER 7: Platform Ops                                            │
│  tags, question_tags, post_tags, notifications, reports,            │
│  admin_actions, platform_config                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Core principle:** Clusters 2, 3, 4 are written by the **Indexer** (from on-chain events).
Clusters 1, 6, 7 are written by the **API**. Cluster 5 is Indexer-internal.
The `users` table is the gravity center — almost everything joins back to it.

---

## 2. Full ERD (Mermaid)

```mermaid
erDiagram

  %% ── IDENTITY & AUTH ──────────────────────────────────────────────
  users {
    uuid id PK
    text wallet_address UK
    text handle UK
    text avatar_cid
    text bio
    bool is_active
    timestamptz created_at
  }

  user_roles {
    uuid id PK
    uuid user_id FK
    enum role
    uuid granted_by FK
    timestamptz revoked_at
  }

  user_sessions {
    uuid id PK
    uuid user_id FK
    text jti UK
    timestamptz expires_at
    timestamptz revoked_at
  }

  auth_nonces {
    uuid nonce PK
    text wallet_address
    timestamptz expires_at
    timestamptz used_at
  }

  %% ── Q&A LOOP ─────────────────────────────────────────────────────
  questions {
    uuid id PK
    int chain_id
    text onchain_question_id UK
    text asker_wallet
    text bounty_token
    numeric bounty_amount
    timestamptz deadline_at
    enum status
    uuid winner_answer_id FK
  }

  answers {
    uuid id PK
    uuid question_id FK
    text onchain_answer_id UK
    text answerer_wallet
    text answer_cid
    enum status
    int vote_count
  }

  answer_votes {
    uuid id PK
    uuid question_id FK
    uuid answer_id FK
    text voter_wallet
    enum direction
    int weight
    UK question_voter
  }

  payouts {
    uuid id PK
    uuid question_id FK
    text recipient_wallet
    numeric amount
    text payout_type
    text tx_hash
  }

  ai_rankings {
    uuid id PK
    uuid question_id FK
    uuid answer_id FK
    float4 ai_score
    int rank_position
    text reason
    UK question_answer
  }

  ai_summaries {
    uuid id PK
    uuid question_id FK_UK
    text summary
    jsonb highlights
  }

  %% ── CONTENT & PAYWALL ────────────────────────────────────────────
  projects {
    uuid id PK
    uuid owner_id FK
    text slug UK
    text title
    enum contribution_policy
    enum status
  }

  project_reviewers {
    uuid project_id FK
    uuid reviewer_id FK
    uuid granted_by FK
    timestamptz revoked_at
    PK project_reviewer
  }

  posts {
    uuid id PK
    int chain_id
    text onchain_post_id UK
    text creator_wallet
    uuid project_id FK
    enum access_type
    numeric price_amount
    uuid current_revision_id FK
    bool is_suspended
  }

  post_revisions {
    uuid id PK
    uuid post_id FK
    int revision_number
    text content_cid
    bool is_encrypted
    text encryption_alg
    UK post_revision_num
  }

  post_access {
    uuid id PK
    uuid post_id FK
    text buyer_wallet
    enum status
    text purchase_tx_hash
    timestamptz confirmed_at
    UK post_buyer
  }

  content_keys {
    uuid id PK
    int chain_id
    text onchain_post_id
    bytea encrypted_key
    int key_version
    UK chain_post
  }

  key_request_nonces {
    uuid nonce PK
    text wallet_address
    text onchain_post_id
    timestamptz expires_at
    timestamptz used_at
  }

  %% ── CONTRIBUTION & REVENUE ───────────────────────────────────────
  contributions {
    uuid id PK
    uuid post_id FK
    text onchain_contribution_id UK
    text contributor_wallet
    enum kind
    text artifact_cid
    enum status
    int share_bps
  }

  revenue_recipients {
    uuid id PK
    uuid post_id FK
    text wallet
    int share_bps
    enum source
    UK post_wallet
  }

  revenue_splits_snapshots {
    uuid id PK
    uuid post_id FK
    int split_version
    jsonb recipients
    UK post_version
  }

  withdrawals {
    uuid id PK
    uuid post_id FK
    text recipient_wallet
    numeric amount
    text tx_hash
  }

  %% ── INDEXER INFRASTRUCTURE ───────────────────────────────────────
  chain_events {
    uuid id PK
    int chain_id
    text tx_hash
    int log_index
    bigint block_number
    text event_name
    jsonb event_payload
    UK chain_tx_log
  }

  failed_events {
    int chain_id PK
    text tx_hash PK
    text log_index PK
    text error
    int retry_count
    timestamptz next_retry_at
  }

  indexer_checkpoints {
    int chain_id PK
    bigint last_processed_block
    bigint safe_block
  }

  %% ── REPUTATION & RANKING ─────────────────────────────────────────
  user_stats {
    uuid user_id PK_FK
    int answers_won
    bigint bounty_earned_usd_cents
    int posts_created
    int total_unique_buyers
    bigint revenue_earned_usd_cents
    int contributions_accepted
    bigint reputation_score
  }

  user_rankings {
    uuid id PK
    uuid user_id FK
    enum category
    enum period
    int rank_pos
    bigint score
    UK user_cat_period
  }

  user_badges {
    uuid id PK
    uuid user_id FK
    enum badge
    timestamptz earned_at
    UK user_badge
  }

  %% ── PLATFORM OPS ─────────────────────────────────────────────────
  tags {
    uuid id PK
    text name UK
    text slug UK
  }

  question_tags {
    uuid question_id FK
    uuid tag_id FK
    PK question_tag
  }

  post_tags {
    uuid post_id FK
    uuid tag_id FK
    PK post_tag
  }

  notifications {
    uuid id PK
    uuid user_id FK
    enum type
    text related_entity_type
    uuid related_entity_id
    bool is_read
  }

  reports {
    uuid id PK
    uuid reporter_id FK
    enum entity_type
    uuid entity_id
    enum status
    uuid reviewed_by FK
  }

  admin_actions {
    uuid id PK
    uuid actor_id FK
    text action
    text target_type
    uuid target_id
    jsonb payload
  }

  platform_config {
    text key PK
    text value
    uuid updated_by FK
  }

  %% ── RELATIONSHIPS ────────────────────────────────────────────────

  %% Identity
  users ||--o{ user_roles : "has platform roles"
  users ||--o{ user_sessions : "has active sessions"
  users ||--|| user_stats : "has stats (1:1)"
  users ||--o{ user_rankings : "has rank positions"
  users ||--o{ user_badges : "earns badges"
  users ||--o{ notifications : "receives"
  users ||--o{ reports : "submits"
  users ||--o{ projects : "owns"

  %% Q&A
  questions ||--o{ answers : "receives answers"
  questions ||--o{ answer_votes : "receives votes"
  questions }o--o| answers : "resolved winner"
  questions ||--o{ payouts : "generates"
  questions ||--o{ question_tags : "tagged with"
  questions ||--o| ai_summaries : "summarized by AI"
  questions ||--o{ ai_rankings : "answers ranked by AI"
  answers ||--o{ answer_votes : "voted on"
  answers ||--o{ ai_rankings : "ranked"
  tags ||--o{ question_tags : "used in"

  %% Content
  projects ||--o{ posts : "contains"
  projects ||--o{ project_reviewers : "has reviewers"
  users ||--o{ project_reviewers : "designated as"
  posts ||--o{ post_revisions : "versioned by"
  posts }o--o| post_revisions : "current revision"
  posts ||--o{ post_access : "grants access"
  posts ||--o{ post_tags : "tagged with"
  tags ||--o{ post_tags : "used in"

  %% Contribution & Revenue
  posts ||--o{ contributions : "receives contributions"
  posts ||--o{ revenue_recipients : "split among"
  posts ||--o{ revenue_splits_snapshots : "audited by"
  posts ||--o{ withdrawals : "withdrawn from"

  %% Ops
  users ||--o{ admin_actions : "performed by"
  users ||--o{ reports : "reviewed by"
```

---

## 3. Relationship Type Catalog

### 3.1 One-to-One (1:1)

| Table A | → | Table B | Enforced by | Meaning |
|---------|---|---------|-------------|---------|
| `users` | → | `user_stats` | PK = user_id (FK) | Every user has exactly one stats row |
| `questions` | → | `ai_summaries` | UNIQUE(question_id) | One AI summary per question |
| `posts` | → | `content_keys` | UNIQUE(chain_id, onchain_post_id) | One encrypted key per on-chain post |

### 3.2 One-to-Many (1:N)

| Parent (1) | Child (N) | FK column | Meaning |
|------------|-----------|-----------|---------|
| `users` | `user_roles` | user_id | User can hold multiple platform roles |
| `users` | `user_sessions` | user_id | User has many login sessions |
| `users` | `user_rankings` | user_id | User ranked in multiple categories & periods |
| `users` | `user_badges` | user_id | User earns multiple badges |
| `users` | `notifications` | user_id | User receives many notifications |
| `users` | `reports` | reporter_id | User can report many entities |
| `users` | `projects` | owner_id | User can own many projects |
| `projects` | `posts` | project_id | Project contains many posts (nullable) |
| `projects` | `project_reviewers` | project_id | Project has many reviewers |
| `questions` | `answers` | question_id | Question has many answers |
| `questions` | `answer_votes` | question_id | Question accumulates many votes |
| `questions` | `payouts` | question_id | Question generates multiple payout records |
| `questions` | `ai_rankings` | question_id | AI ranks all answers per question |
| `answers` | `answer_votes` | answer_id | Each answer gets multiple votes |
| `answers` | `ai_rankings` | answer_id | Each answer has one AI rank per question |
| `posts` | `post_revisions` | post_id | Post has many revisions |
| `posts` | `post_access` | post_id | Post has many buyers |
| `posts` | `contributions` | post_id | Post receives many contributions |
| `posts` | `revenue_recipients` | post_id | Post split among multiple recipients |
| `posts` | `revenue_splits_snapshots` | post_id | Post has audit trail of split changes |
| `posts` | `withdrawals` | post_id | Post triggers multiple withdrawals |

### 3.3 Many-to-Many (N:M) via Junction Tables

| Left (N) | Junction | Right (M) | Unique constraint | Meaning |
|----------|----------|-----------|-------------------|---------|
| `users` | `project_reviewers` | `projects` | (project_id, reviewer_id) | Users can review multiple projects; projects have multiple reviewers |
| `questions` | `question_tags` | `tags` | (question_id, tag_id) | Questions can have many tags; tags apply to many questions |
| `posts` | `post_tags` | `tags` | (post_id, tag_id) | Posts can have many tags; tags apply to many posts |

### 3.4 Self-referential (back-pointer)

| Table | Column | Points to | Why it exists |
|-------|--------|-----------|--------------|
| `questions` | `winner_answer_id` | `answers.id` | After resolve, question records which answer won |
| `posts` | `current_revision_id` | `post_revisions.id` | Post always tracks its latest confirmed revision |

These create **circular dependencies** at the DDL level — solved in migrations by:
1. Create `posts` without `current_revision_id` FK
2. Create `post_revisions` with `post_id` FK → posts
3. `ALTER TABLE posts ADD CONSTRAINT fk_current_revision ...`

---

## 4. Cluster-by-Cluster Relationship Explanation

---

### 4.1 Identity & Auth Cluster

```
                   ┌──────────────────────────────────────┐
                   │             users                    │
                   │  id (UUID)                           │
                   │  wallet_address (UNIQUE)  ◄──────────┼── all on-chain tables join here
                   │  handle, avatar_cid, bio             │    via wallet_address (TEXT join)
                   └──────────┬───────────────────────────┘
                              │
              ┌───────────────┼────────────────────┐
              │               │                    │
              ▼               ▼                    ▼
       user_roles      user_sessions          auth_nonces
    (platform role)  (JWT tracking)        (sign-in challenge)
    admin/moderator   jti, expires_at      nonce, expires_at,
                      revoked_at           used_at (1-time)
```

**Key relationships:**

- `users → user_roles` (1:N, optional)
  - A user can have zero (= `normal_user`) or more rows: `admin`, `moderator`.
  - `granted_by` FK → `users` tracks who elevated them (audit chain).
  - `revoked_at` = soft revoke (history preserved).

- `users → user_sessions` (1:N)
  - One user may have many active sessions (multiple devices).
  - `jti` (JWT ID) is globally unique — used to revoke a specific token.
  - `revoked_at` = explicit logout without invalidating other sessions.

- `auth_nonces` (standalone, wallet-indexed, no FK to users)
  - No FK to `users` because the nonce is issued **before** we know if the user exists.
  - Join to users post-hoc via `wallet_address` after signature verification.
  - `used_at` is set atomically on `/auth/verify` — prevents replay.

---

### 4.2 Q&A Loop Cluster

```
users
  │ wallet_address (TEXT loose join)
  │
  ▼
questions  ──────────────────────────────────────────┐
  │ id                                               │
  │ winner_answer_id (nullable FK → answers)         │ back-pointer after resolve
  │                                                  │
  ├──── 1:N ──► answers                             │
  │               │ id ◄──────────────────────────── ┘
  │               │ vote_count (denormalized)
  │               │
  ├──── 1:N ──► answer_votes ◄─── (answers FK + questions FK)
  │               │ UNIQUE(question_id, voter_wallet)  ← I7
  │
  ├──── 1:N ──► payouts   (after QuestionResolved event)
  │
  ├──── 1:1 ──► ai_summaries  (AI-generated, UX only)
  │
  └──── 1:N ──► ai_rankings ──► answers
                 (AI ranks each answer within a question)
```

**Key relationships explained:**

- **`questions → answers` (1:N)**
  A question gets zero or more answers. Each answer knows its `question_id`.
  After resolve, exactly one answer transitions to `status=winner`; all others become `status=lost`.

- **`answer_votes` (bridge between questions AND answers)**
  `answer_votes` holds TWO foreign keys:
  - `question_id` → enforces the `UNIQUE(question_id, voter_wallet)` constraint (1 wallet = 1 vote per question, regardless of which answer)
  - `answer_id` → tells us which specific answer was voted for
  
  This dual-FK design is deliberate: you can't vote twice in the same question even if you vote for different answers.

- **`questions.winner_answer_id → answers.id` (nullable back-pointer)**
  NULL while open. Set to the winning answer's UUID when `QuestionResolved` event fires.
  Invariant I6: `status=resolved` ↔ `winner_answer_id IS NOT NULL`.

- **`payouts` (event-sourced audit)**
  Each `QuestionResolved` event generates 2–3 payout rows:
  - `payout_type=winner` → bounty to winner wallet
  - `payout_type=platform_fee` → fee to platform treasury
  - `payout_type=refund` (if no winner) → bounty back to asker

- **`ai_rankings` (bridges questions and answers)**
  AI Service writes one row per (question, answer) pair with a score + rank position.
  The AI reads `answers` + `answer_votes` but can only write to `ai_rankings` and `ai_summaries`.
  It has NO write path to `answer_votes`, `questions`, or `payouts`.

---

### 4.3 Content & Paywall Cluster

```
users
  │ owner_id (UUID FK)
  │
  ▼
projects ──────────────────────────────────────────────────────────┐
  │ id                                                             │
  ├── 1:N ──► project_reviewers ◄─── users (reviewer_id FK)       │
  │                                                               │
  │ project_id (nullable FK)                                      │
  ▼                                                               │
posts ─────────────────────────────────────────────────────────── ┘
  │ id (UUID)
  │ onchain_post_id (TEXT, from contract)
  │ creator_wallet (TEXT, loose join to users)
  │
  │ current_revision_id (FK → post_revisions)  ◄──── back-pointer
  │                                                              │
  ├──── 1:N ──► post_revisions ──────────────────────────────── ┘
  │               │ UNIQUE(post_id, revision_number)
  │               │ content_cid → IPFS (ciphertext or plaintext)
  │               │ is_encrypted (must be TRUE for premium)
  │
  ├──── 1:N ──► post_access
  │               │ UNIQUE(post_id, buyer_wallet)
  │               │ status: pending → confirmed → reverted
  │
  └── (chain_id, onchain_post_id) ──► content_keys  [1:1, text join]
                                         encrypted_key (AES at rest)

key_request_nonces (standalone, wallet + post scoped)
  → no FK, joined via wallet_address + onchain_post_id
```

**Key relationships explained:**

- **`projects → posts` (1:N, nullable)**
  A post can exist standalone (no project) OR belong to a project.
  A project is a logical container — a course series, a research project.
  When `project_id` is set, the post inherits the project's `contribution_policy`.

- **`projects ↔ users` via `project_reviewers` (N:M)**
  A project owner can invite multiple users as reviewers.
  A user can be a reviewer on multiple projects.
  `granted_by` must be the project owner — tracks delegation chain.

- **`posts ↔ post_revisions` (circular 1:N + 1:1 back-pointer)**
  This is the most complex relationship in the schema:
  - `post_revisions.post_id → posts.id` (1:N, standard forward FK)
  - `posts.current_revision_id → post_revisions.id` (1:1 back-pointer)
  
  Why two directions? Because `posts` needs to know **the current version** instantly
  without a MAX(revision_number) subquery on every feed query.
  
  The Indexer maintains the back-pointer: on `PostEdited`, it inserts the new revision
  then updates `posts.current_revision_id` in the same transaction.

- **`post_access` (buyer access record)**
  UNIQUE `(post_id, buyer_wallet)` — one active access record per buyer per post.
  `status` travels: `pending` (tx seen) → `confirmed` (N blocks) → `reverted` (reorg).
  The Key Service checks this table before delivering the decryption key.

- **`posts ↔ content_keys` (1:1, text join)**
  NOT a UUID FK. Joined via `(chain_id, onchain_post_id)` because:
  - Key Service stores the key using the on-chain post ID (received from creator before indexer confirms)
  - Indexer creates the `posts` row with its own UUID later
  - Text join decouples these two write paths (no ordering dependency)

---

### 4.4 Contribution & Revenue Cluster

```
posts
  │ id (UUID)
  │
  ├──── 1:N ──► contributions
  │               │ UNIQUE(chain_id, onchain_contribution_id)
  │               │ contributor_wallet (TEXT loose join to users)
  │               │ status: submitted → accepted / rejected
  │               │ share_bps (set only when accepted)
  │
  ├──── 1:N ──► revenue_recipients
  │               │ UNIQUE(post_id, wallet)
  │               │ SUM(share_bps) = 10000 ALWAYS  ← I4
  │               │ source: creator / contribution / platform
  │               │
  │               │ Mutation pattern on ContributionAccepted:
  │               │   INSERT contributor row (share_bps = X)
  │               │   UPDATE creator row (share_bps -= X)
  │               │   platform row unchanged
  │
  ├──── 1:N ──► revenue_splits_snapshots
  │               │ Immutable audit trail
  │               │ UNIQUE(post_id, split_version)
  │               │ recipients JSONB = snapshot of revenue_recipients at that moment
  │
  └──── 1:N ──► withdrawals
                  │ recipient_wallet (TEXT loose join to users)
                  │ Written when Withdraw event fires on-chain
```

**Key relationships explained:**

- **`contributions → posts` (N:1)**
  Many contributors can submit to the same post.
  Each contribution is independently reviewed (accepted/rejected).
  `share_bps` is NULL until accepted — a business invariant enforced in application code.

- **`revenue_recipients` (materialized split state)**
  This table is the "current truth" of who earns what from a post.
  It's NOT historical — it reflects the current live split.
  The Indexer recomputes it atomically on each `ContributionAccepted`:
  1. INSERT the contributor row
  2. UPDATE creator's row (decrease by contributor's share)
  3. Verify SUM = 10000 (Invariant I4)

- **`revenue_splits_snapshots` (immutable audit trail)**
  Every time `revenue_recipients` changes, a snapshot is saved here.
  `split_version` monotonically increases per post.
  The JSONB `recipients` column is a full copy of the recipients at that version.
  This answers "what was the split at version 3?" without complex history queries.

- **`withdrawals` (event-sourced payout log)**
  Pull-payment: recipients call `withdraw(postId)` on-chain.
  Indexer records each withdrawal here.
  Does NOT decrement `revenue_recipients.share_bps` — that's a percentage, not a balance.
  The actual balance tracking lives in the contract.

---

### 4.5 Indexer Infrastructure Cluster

```
chain_events  ─────────────────────────────────────────────────────
  │ UNIQUE(chain_id, tx_hash, log_index)  ← idempotency key I5
  │
  │ For every event received:
  │   Step 1: CHECK if (chain_id, tx_hash, log_index) exists → SKIP if yes
  │   Step 2: INSERT chain_events
  │   Step 3: Process event → upsert target tables
  │   Step 4: On failure → INSERT failed_events
  │
  ├──► failed_events  (shares same PK as chain_events: chain_id+tx_hash+log_index)
  │      retry_count, next_retry_at → exponential backoff
  │
  └──► indexer_checkpoints  (per chain_id)
         last_processed_block, safe_block
         Safe block = last_processed_block - N (reorg-safe depth)
         On reorg: reset to safe_block, backfill forward
```

**Key relationships explained:**

- `chain_events` has NO foreign keys to business tables.
  It is the foundation layer — business tables reference it conceptually (not via FK)
  by checking their own `created_tx_hash` columns.

- `failed_events` shares the same composite PK `(chain_id, tx_hash, log_index)` as `chain_events`.
  An event is in one of two states: succeeded (in `chain_events`) or failed (in `failed_events`).
  After retry succeeds, the `chain_events` row is inserted and the `failed_events` row is deleted.

- `indexer_checkpoints` is a singleton per chain — one row per `chain_id`.
  It tracks the "safe block" which is `N` blocks behind the tip (default N=12).
  All confirmations are relative to this: only events at `block_number <= safe_block` are marked confirmed.

---

### 4.6 Reputation & Ranking Cluster

```
users
  │
  │ All on-chain events → background job reads these tables:
  │   questions, answers, answer_votes, posts, post_access,
  │   contributions, withdrawals
  │
  ▼
user_stats  (1:1 with users, materialized aggregate)
  │ reputation_score = f(answers_won, bounty_earned, revenue_earned, ...)
  │
  ├──── triggers ──► user_rankings  (per category × period)
  │                   rank_pos recomputed by comparing all user scores
  │
  └──── triggers ──► user_badges  (threshold checks on stats)
                      UNIQUE(user_id, badge) — each badge awarded once
```

**Key relationships explained:**

- **`user_stats` (1:1 with users)**
  The single most-read table after `users`.
  It aggregates data from BOTH the BE database (profile) AND the Indexer database
  (questions, answers, posts, contributions) — it's a cross-database materialized view.
  Updated by a background job every 15 minutes + async trigger on key events.

- **`user_rankings` (1:N with users)**
  One user has multiple rank rows: `(overall, all_time)`, `(creator, monthly)`, etc.
  UNIQUE `(user_id, category, period)` ensures no duplicates.
  The index on `(category, period, rank_pos)` serves leaderboard queries in O(1).

- **`user_badges` (1:N, each badge unique per user)**
  UNIQUE `(user_id, badge)` — prevents awarding the same badge twice.
  Checked whenever `user_stats` is updated:
  - `answers_won >= 10` → award `expert_answerer`
  - `contributions_accepted >= 5` → award `top_contributor`
  - etc.

---

### 4.7 Platform Ops Cluster

```
tags ──┬──► question_tags ──► questions  (N:M)
       └──► post_tags ──────► posts      (N:M)

users
  ├──► notifications  (polymorphic target: question/answer/post/contribution)
  ├──► reports        (polymorphic subject: any entity)
  └──► admin_actions  (polymorphic target + full payload JSONB)

platform_config  (key-value, no FKs except updated_by → users)
```

**Key relationships explained:**

- **`tags` (shared vocabulary, N:M to both questions and posts)**
  Tags are platform-wide — a tag like `blockchain` applies to both questions and posts.
  Using separate junction tables (`question_tags`, `post_tags`) keeps the schema clean
  and allows different tag sets per content type.

- **`notifications` (polymorphic, fan-out)**
  `related_entity_type` + `related_entity_id` form a **polymorphic reference**
  (not an enforced FK — a convention).
  The API resolves the entity when rendering the notification:
  - `entity_type='question'` → join to `questions`
  - `entity_type='post'` → join to `posts`
  - etc.

- **`reports` (polymorphic abuse reporting)**
  Same polymorphic pattern: `entity_type + entity_id`.
  `reviewed_by → users` adds a second FK: the moderator who reviewed the report.
  This creates a read path: `reports JOIN users AS reviewer ON reviewed_by = reviewer.id`.

- **`admin_actions` (immutable audit log)**
  NEVER updated after insert. The `payload JSONB` captures before/after state for rollback analysis.
  `target_type + target_id` are polymorphic.

---

## 5. Special Relationship Patterns

### 5.1 Wallet-based Loose Joins

Several Indexer-managed tables store `wallet_address` as TEXT instead of UUID FK to `users`.
This is intentional.

```
Why NOT a UUID FK?
  Problem: Indexer processes on-chain events. Events contain wallet addresses.
  At processing time, the user may NOT have a profile row in the BE database.
  A user can appear on-chain before they ever visit the platform.

  Solution: Store wallet_address as TEXT. API joins to users on query:
    SELECT q.*, u.handle, u.avatar_cid
    FROM questions q
    LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(q.asker_wallet)

Tables using wallet TEXT joins:
  questions.asker_wallet → users.wallet_address
  answers.answerer_wallet → users.wallet_address
  answer_votes.voter_wallet → users.wallet_address
  posts.creator_wallet → users.wallet_address
  contributions.contributor_wallet → users.wallet_address
  revenue_recipients.wallet → users.wallet_address
  payouts.recipient_wallet → users.wallet_address
  withdrawals.recipient_wallet → users.wallet_address

Normalization rule: always store wallet_address as LOWERCASE hex.
  Both BE and Indexer must normalize: strings.ToLower(wallet)
```

### 5.2 Polymorphic References

Three tables use a `(entity_type TEXT, entity_id UUID)` pattern:

```
notifications:
  related_entity_type IN ('question','answer','post','contribution')
  related_entity_id UUID → varies

reports:
  entity_type IN ('question','answer','post','contribution','user')
  entity_id UUID → varies

admin_actions:
  target_type IN ('user','post','question','contribution')
  target_id UUID → varies

Tradeoff:
  PRO: flexible, no need for separate notification_for_questions / notification_for_posts tables
  CON: no referential integrity enforcement — orphaned entity_id possible
  Mitigation: application-level validation; soft deletes instead of hard deletes
```

### 5.3 Circular FK (posts ↔ post_revisions)

```
posts.current_revision_id → post_revisions.id
post_revisions.post_id → posts.id

This is a circular dependency. Solved in two migration steps:

Step 1 (migration 16):
  CREATE TABLE posts (
    id UUID PRIMARY KEY,
    current_revision_id UUID   -- no FK constraint yet
  );

Step 2 (migration 17):
  CREATE TABLE post_revisions (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id)
  );

Step 3 (migration 18):
  ALTER TABLE posts
    ADD CONSTRAINT fk_current_revision
    FOREIGN KEY (current_revision_id) REFERENCES post_revisions(id)
    DEFERRABLE INITIALLY DEFERRED;

The DEFERRABLE INITIALLY DEFERRED allows the Indexer to:
  1. INSERT posts (current_revision_id = NULL)
  2. INSERT post_revisions (post_id = posts.id)
  3. UPDATE posts SET current_revision_id = post_revisions.id
  All in one transaction, without violating the FK at intermediate steps.
```

### 5.4 Materialized Aggregates (user_stats)

```
user_stats is a DERIVED table — not a source of truth.

Source tables (Indexer-managed):
  questions → questions_asked, bounty_spent
  answers → answers_submitted
  answer_votes (cross-referenced at resolve) → answers_won, bounty_earned, vote_accuracy
  posts → posts_created, premium_posts_created
  post_access → total_unique_buyers, revenue_earned
  contributions → contributions_submitted, contributions_accepted
  withdrawals → contribution_revenue_earned

Computation:
  Background job runs every 15 minutes:
    SELECT COUNT(*) FROM answers WHERE answerer_wallet = ? AND status = 'winner'
    → user_stats.answers_won = result

  Also triggered async on:
    QuestionResolved → update winner's and voters' stats
    AccessPurchased confirmed → update creator's revenue
    ContributionAccepted → update contributor's accepted count

Consequence: user_stats may lag by up to 15 minutes in the worst case.
For leaderboard display, this is acceptable.
For real-time "you just won!" notifications, use the event directly (not user_stats).
```

---

## 6. Flow-Based ERD Walkthroughs

### 6.1 Q&A Full Lifecycle

Which entities are touched, and in what order, as a question goes from creation to payout.

```
Phase 1 — Question Created
  ON-CHAIN: QnA_contract.createQuestion(bounty, cid, deadline)
  ├── chain_events ← INSERT (idempotency lock)
  ├── questions ← INSERT status=open
  └── question_tags ← INSERT (API writes after confirmation)

  Reads for display:
  └── questions JOIN users (wallet join) JOIN question_tags JOIN tags

Phase 2 — Answer Submitted
  ON-CHAIN: QnA_contract.submitAnswer(questionId, answerCid)
  ├── chain_events ← INSERT
  ├── answers ← INSERT status=submitted, vote_count=0
  └── notifications ← INSERT for asker (answer_submitted_to_your_question)

  AI Async (triggered):
  ├── ai_rankings ← UPSERT (scores this answer)
  └── ai_summaries ← UPSERT (summarizes thread so far)

Phase 3 — Vote Cast
  ON-CHAIN: QnA_contract.vote(questionId, answerId, up)
  ├── chain_events ← INSERT
  ├── answer_votes ← INSERT [blocked by UNIQUE(question_id, voter_wallet) if duplicate]
  ├── answers ← UPDATE vote_count++ (denormalized)
  └── ai_rankings ← UPSERT (AI re-scores with new vote signal)

Phase 4 — Resolve + Payout
  ON-CHAIN: QnA_contract.resolve(questionId) [permissionless after deadline]
  ├── chain_events ← INSERT
  ├── questions ← UPDATE status=resolved, winner_answer_id=X, resolved_at=NOW()
  ├── answers ← UPDATE status=winner WHERE id=X
  ├── answers ← UPDATE status=lost WHERE question_id=Q AND id!=X
  ├── payouts ← INSERT (winner + platform_fee rows)
  └── notifications ← INSERT (bounty_won for winner; question_resolved for asker)

  Background job triggered:
  ├── user_stats ← UPDATE winner (answers_won++, bounty_earned+=X)
  ├── user_stats ← UPDATE asker (questions_resolved_with_winner++)
  ├── user_stats ← UPDATE each voter (vote_accuracy_bps recomputed)
  ├── user_rankings ← REFRESH affected categories
  └── user_badges ← CHECK thresholds → INSERT if earned
```

**Entity dependency chain for Q&A:**
```
users ──[wallet]──► questions ──► answers ──► answer_votes
                       │              │            │
                       │              └────────────┤
                       │                           ▼
                       └──────────────────► payouts + notifications
                                                   │
                                                   ▼
                                            user_stats → user_rankings → user_badges
```

---

### 6.2 Premium Content Lifecycle

```
Phase 1 — Post Created (Creator side)
  CLIENT SIDE (FE, not in DB):
  ├── generate contentKey (32-byte random)
  └── encrypt content → ciphertext → upload IPFS → cipherCid

  API call (before tx):
  └── content_keys ← INSERT {chain_id, onchain_post_id, encrypted_key}
                       (Key Service encrypts at rest)

  ON-CHAIN: Content_contract.createPost(premium, price, cipherCid, previewCid)
  ├── chain_events ← INSERT
  ├── posts ← INSERT {access_type=premium, price, creator_wallet, current_revision_id=NULL}
  ├── post_revisions ← INSERT {rev=1, content_cid=cipherCid, is_encrypted=TRUE}
  ├── posts ← UPDATE current_revision_id = post_revisions.id  ← I1
  ├── revenue_recipients ← INSERT creator (9500 bps) + platform (500 bps)
  └── revenue_splits_snapshots ← INSERT version=1

  API writes after confirmation:
  └── post_tags ← INSERT

Phase 2 — Buyer Purchases Access
  ON-CHAIN: Content_contract.purchaseAccess(postId)
  ├── chain_events ← INSERT
  ├── post_access ← INSERT status=pending {post_id, buyer_wallet, tx_hash}
  ├── [wait N=12 confirmations]
  ├── post_access ← UPDATE status=confirmed, confirmed_at=NOW()  ← I3
  └── notifications ← INSERT {access_confirmed for buyer; new_buyer for creator}

  user_stats (async):
  └── creator: total_unique_buyers++, revenue_earned+=price

Phase 3 — Buyer Requests Decryption Key
  API: POST /auth/key-nonce
  └── key_request_nonces ← INSERT {nonce, wallet, post_id, expires_at}

  Buyer signs nonce with wallet, sends to:
  API: POST /keys/request {postId, wallet, nonce, signature}
  ├── key_request_nonces ← READ (check exists + not expired + not used)
  ├── key_request_nonces ← UPDATE used_at=NOW()
  ├── post_access ← READ {post_id, buyer_wallet, status=confirmed}  ← verify access
  └── content_keys ← READ {chain_id, onchain_post_id} → decrypt → return key

  CLIENT SIDE:
  ├── fetch ciphertext from IPFS (CID from post_revisions.content_cid)
  └── decrypt with contentKey → render

Phase 4 — Reorg (edge case)
  Indexer detects block hash mismatch:
  └── post_access ← UPDATE status=reverted, reverted_at=NOW()
      → Key Service will now deny key (access check fails)
  └── notifications ← INSERT {access_reverted for buyer}
```

**Entity dependency chain for premium:**
```
users ──[wallet]──► posts ◄──── projects (optional grouping)
                      │
          ┌───────────┼──────────────────────────┐
          │           │                          │
          ▼           ▼                          ▼
   post_revisions  post_access             content_keys
   (ciphertext     (buyer access           (encrypted key
    CID pointer)    confirmed?)             at rest)
          │           │                          │
          │           └──────── Key Service ─────┘
          │                      verifies both
          ▼
   IPFS fetch (ciphertext)
   + contentKey
   = decrypt → render
```

---

### 6.3 Contribution Marketplace Lifecycle

```
Phase 1 — Contribution Submitted
  ON-CHAIN: Content_contract.submitContribution(postId, cid, kind)
  ├── chain_events ← INSERT
  ├── contributions ← INSERT {status=submitted, artifact_cid, kind}
  └── notifications ← INSERT for post owner (new contribution)

Phase 2 — Owner Reviews (reads only)
  API:
  ├── contributions ← READ (list for post_id, status=submitted)
  ├── fetch artifact from IPFS (via artifact_cid)
  └── posts ← READ (owner verification: creator_wallet = caller)

Phase 3 — Accept Contribution
  ON-CHAIN: Content_contract.acceptContribution(postId, contribId, shareBps)
  ├── chain_events ← INSERT
  ├── contributions ← UPDATE status=accepted, share_bps=X, reviewed_by_wallet=Y
  │
  ├── revenue_recipients logic (atomic):
  │     SELECT share_bps FROM revenue_recipients WHERE post_id=P AND source='creator'
  │     → creator_current = 9500
  │     UPDATE revenue_recipients SET share_bps = creator_current - X
  │         WHERE post_id=P AND source='creator'
  │     INSERT revenue_recipients {post_id=P, wallet=contributor, share_bps=X, source=contribution}
  │     VERIFY SUM(share_bps) = 10000  ← I4
  │
  ├── revenue_splits_snapshots ← INSERT {split_version++, recipients=JSONB snapshot}
  └── notifications ← INSERT for contributor (contribution_accepted)

  user_stats (async):
  └── contributor: contributions_accepted++

Phase 4 — Withdraw Earnings
  ON-CHAIN: Content_contract.withdraw(postId) [called by any recipient]
  ├── chain_events ← INSERT
  ├── withdrawals ← INSERT {post_id, recipient_wallet, amount}
  └── notifications ← INSERT {withdrawal_completed}
```

**Entity dependency chain for contributions:**
```
posts ──────────────────────────────────────────────────────────
  │                                                             │
  ├──► contributions (submitted) ── accept ──► revenue_recipients
  │         │                                       │
  │    [artifact CID]                    SUM(share_bps)=10000
  │     → IPFS fetch                          │
  │                                           │
  └──► revenue_splits_snapshots ◄─────────────┘
       (immutable audit after each change)
  │
  └──► withdrawals (when recipient calls withdraw())
```

---

### 6.4 Auth & Key Delivery Lifecycle

```
Sign-in flow:
  POST /auth/nonce
  └── auth_nonces ← INSERT {nonce, wallet, expires_at}
                     │
                     ▼ (client signs)
  POST /auth/verify {wallet, nonce, signature}
  ├── auth_nonces ← READ (check exists + not expired + not used)
  ├── auth_nonces ← UPDATE used_at=NOW()  (consumed, anti-replay)
  ├── users ← READ or INSERT (lazy create profile)
  └── user_sessions ← INSERT {jti, user_id, expires_at}
      → issue JWT containing {sub=user_id, jti, wallet, exp}

Key request flow:
  POST /auth/key-nonce {postId, wallet}
  └── key_request_nonces ← INSERT {nonce, wallet, post_id, expires_at}
                            │
                            ▼ (client signs)
  POST /keys/request {postId, wallet, nonce, signature}
  ├── key_request_nonces ← READ (check + not used)
  ├── key_request_nonces ← UPDATE used_at=NOW()
  ├── post_access ← READ WHERE (post_id, buyer_wallet, status=confirmed)
  ├── content_keys ← READ WHERE (chain_id, onchain_post_id)
  └── decrypt encrypted_key → return to client
      [LOG: postId, wallet, request_id, result — NEVER log key itself]

Session revocation:
  DELETE /auth/session (logout)
  └── user_sessions ← UPDATE revoked_at=NOW()
      JWT jti checked against user_sessions on each request
```

---

## 7. Cross-Domain Relationships

These relationships span multiple clusters and are the most architecturally significant.

```
Cross-domain relationship 1: Indexer → Reputation
  Indexer writes → questions, answers, answer_votes, posts, post_access, contributions
  Background job reads these → aggregates into user_stats
  user_stats → user_rankings → user_badges

  Key implication: user_stats is always a derivative, never authoritative.
  If user_stats is corrupted, recompute from scratch from Indexer tables.

Cross-domain relationship 2: users (BE) ↔ on-chain tables (Indexer)
  On-chain tables store wallet_address as TEXT.
  users table stores wallet_address as TEXT UNIQUE.
  Join: on-chain_table.creator_wallet = users.wallet_address

  Key implication: a user CAN appear in on-chain tables before creating a profile.
  LEFT JOIN users from on-chain tables — never INNER JOIN.

Cross-domain relationship 3: content_keys (BE) ↔ posts + post_access (Indexer)
  Key Service:
    reads post_access (Indexer) to verify buyer access
    reads content_keys (BE) to retrieve key
  Join: content_keys.(chain_id, onchain_post_id) ↔ posts.(chain_id, onchain_post_id)

  Key implication: Key Service bridges both databases.
  It must be able to query both. In MVP (same PostgreSQL): trivial.
  In V2 (separate databases): Key Service needs read access to Indexer DB.

Cross-domain relationship 4: platform_config (BE) → Indexer behavior
  platform_config.indexer_confirmations → N blocks before confirmed
  platform_config.platform_fee_bps → used when computing revenue_recipients on PostCreated

  Key implication: Indexer reads platform_config on startup / config reload.
  Changes to platform_fee_bps only affect NEW posts, not existing ones.
```

---

## 8. Relationship Summary Table

| Relationship | Type | From | To | FK Column | Business Meaning |
|-------------|------|------|-----|-----------|-----------------|
| User owns projects | 1:N | users | projects | owner_id | Project ownership |
| User is reviewer | N:M | users ↔ projects | project_reviewers | reviewer_id / project_id | Delegated contribution review |
| User has sessions | 1:N | users | user_sessions | user_id | Multi-device login |
| User has roles | 1:N | users | user_roles | user_id | Platform role assignment |
| User has stats | 1:1 | users | user_stats | user_id | Reputation aggregate |
| User has rankings | 1:N | users | user_rankings | user_id | Leaderboard positions |
| User earns badges | 1:N | users | user_badges | user_id | Achievement system |
| User gets notified | 1:N | users | notifications | user_id | Push/poll notifications |
| User files reports | 1:N | users | reports | reporter_id | Abuse moderation |
| Project contains posts | 1:N | projects | posts | project_id | Content grouping |
| Post has revisions | 1:N | posts | post_revisions | post_id | Edit history |
| Post tracks current rev | 1:1 back-ptr | posts | post_revisions | current_revision_id | Latest confirmed revision (I1) |
| Post grants access | 1:N | posts | post_access | post_id | Buyer access registry |
| Post receives contributions | 1:N | posts | contributions | post_id | Contribution receipts |
| Post splits revenue | 1:N | posts | revenue_recipients | post_id | Current payout split |
| Post audits splits | 1:N | posts | revenue_splits_snapshots | post_id | Split history (I4 audit) |
| Post tracks withdrawals | 1:N | posts | withdrawals | post_id | Pull-payment records |
| Question gets answers | 1:N | questions | answers | question_id | Q&A relationship |
| Question resolves winner | 1:1 back-ptr | questions | answers | winner_answer_id | Post-resolve pointer (I6) |
| Question gets votes | 1:N | questions | answer_votes | question_id | Vote scoping (I7) |
| Question generates payouts | 1:N | questions | payouts | question_id | Payout audit |
| Question has AI summary | 1:1 | questions | ai_summaries | question_id | AI UX layer |
| Answer gets votes | 1:N | answers | answer_votes | answer_id | Per-answer vote count |
| Answer has AI rank | 1:1 per question | answers | ai_rankings | answer_id | AI UX layer |
| Questions tagged | N:M | questions ↔ tags | question_tags | question_id / tag_id | Topic tagging |
| Posts tagged | N:M | posts ↔ tags | post_id / tag_id | post_tags | Topic tagging |
| Posts have keys | 1:1 text-join | posts | content_keys | onchain_post_id | Decryption key storage |
| Nonces for auth | standalone | — | auth_nonces | wallet (text) | Sign-in anti-replay |
| Nonces for keys | standalone | — | key_request_nonces | wallet + post (text) | Key delivery anti-replay |
| Chain event ledger | standalone | — | chain_events | (chain_id, tx_hash, log_index) | Idempotency (I5) |
| Failed event retry | 1:1 (PK shared) | chain_events | failed_events | composite PK | Retry queue |
| Chain checkpoints | standalone per chain | — | indexer_checkpoints | chain_id | Reorg recovery |
