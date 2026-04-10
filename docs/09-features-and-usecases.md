# 09) Features & Use-cases — Full inventory (MVP-first)

This document consolidates **all features + use-cases** for the project with an **MVP-first** approach:
- Runs on an existing **EVM chain**.
- **Q&A**: pay to ask; answers are free; **voting selects the winner/payout** after the deadline; **AI is UX-only**.
- **Premium content / Courses**: pay-per-view premium; ciphertext on IPFS; decrypt client-side; MVP uses a Key Service.
- **Proof of ownership + private vault**: a goal, but recommended after MVP Q&A + Premium (unless you want it as a core pillar from day 1).

---

## 1) Actors

- **Guest**: not connected.
- **User (wallet owner)**: can be an asker/answerer/creator/buyer.
- **Asker**: creates questions (pay to ask).
- **Answerer**: answers questions; can win the bounty via votes.
- **Voter**: votes (1 wallet = 1 vote) to select the winner.
- **Creator**: publishes courses/premium posts (free or premium).
- **Buyer/Reader**: buys premium access.
- **Contributor**: submits contribution receipts (CID) to a post.
- **Reviewer** (optional): can accept contributions on behalf of the creator.
- **Platform operator**: runs API / indexer / key service (MVP).

---

## 2) Modules (bounded contexts)

### A. Identity & Session (Wallet-based auth)
- Connect wallet
- Sign-in via signature challenge (nonce, TTL, anti-replay)
- Session/JWT, logout
- Basic profile (wallet, handle, avatar optional)

### B. Q&A (Paid Ask + Answer + Payout)
- Question lifecycle: create → open → resolved/expired/cancelled
- Answer lifecycle: submit → winner (best by votes) after resolve
- Voting (1 wallet = 1 vote) + resolve after deadline
- Escrow bounty + auto payout
- Anti-spam for question creation (minimum bounty, rate limits)
- Ranking/feeds, tags, search

### C. Content / Courses (Free + Premium)
- Create post/lesson (free hoặc premium)
- Revisions/edit history
- Premium access: purchase → confirmed → read (decrypt)
- Pay-per-view pricing (USDC), revenue accounting

### D. Proof-of-Contribution Marketplace (đóng góp + chia doanh thu)
- Submit contribution receipt (CID)
- Review/accept/reject
- Assign `shareBps` (0..10000)
- Revenue recipients materialization + withdraw

### E. Storage (IPFS) & Crypto (E2EE for premium/vault)
- Upload/pin/fetch content (gateway strategy, retry)
- Encryption envelope format (alg, nonce, ciphertext, aad, schema_version)
- Key delivery (MVP: Key Service; V2: threshold/Lit)

### F. Indexer & Data integrity
- Subscribe events
- Confirmations N + reorg handling
- Idempotency ledger `(chain_id, tx_hash, log_index)`
- Backfill/reindex tooling
- Monitoring: lag, error rate, retries

### G. Platform Ops (security, abuse, observability)
- Rate limiting, bot/spam mitigation
- Audit logs (không log plaintext keys)
- Backups, migrations, health checks

---

## 3) Use-case inventory (theo user journey)

### 3.1 Onboarding & identity
- **UC-Auth-1**: Guest connect wallet
- **UC-Auth-2**: Sign-in bằng signature challenge (nonce)
- **UC-Auth-3**: Cập nhật profile (handle/avatar) (optional MVP)

### 3.2 Q&A (Paid Ask)
- **UC-QA-1**: Browse questions feed (tags, sort, pagination)
- **UC-QA-2**: View question detail + answers list
- **UC-QA-3**: Create question (pay to ask)
  - Input: title/body/tags, bounty/token, deadline (recommended)
  - Output: question hiển thị pending → confirmed (sau indexer)
- **UC-QA-4**: Submit answer (free to answer)
  - Answer body dài → upload IPFS → submit CID on-chain (recommended)
- **UC-QA-5**: Vote answers (1 wallet = 1 vote; optional downvote)
- **UC-QA-6**: Resolve question sau deadline (permissionless / keeper)
  - Winner = answer có vote cao nhất
  - Fallback when voteCount=0 (refund/treasury/extend) — must be decided
- **UC-QA-7**: Auto payout bounty cho winner (trong `resolve`) hoặc pull-payment (tuỳ contract)
- **UC-QA-8**: Report spam/abuse (optional MVP)
- **UC-QA-9**: Question expiry/refund/treasury fallback flow (recommended)

### 3.3 Premium posts / Courses (Pay-per-view)
- **UC-Post-1**: Browse courses/posts feed (free + premium preview)
- **UC-Post-2**: Read free post
- **UC-Post-3**: Create free post (upload plaintext CID)
- **UC-Post-4**: Create premium post (encrypt → upload ciphertext → createPost)
- **UC-Post-5**: Edit post (revision: `PostEdited`)
- **UC-Post-6**: Purchase access (USDC) → `AccessPurchased`
- **UC-Post-7**: Read premium (request key → decrypt client-side)
- **UC-Post-8**: Pending/confirmed UX (tx pending + indexer lag)
- **UC-Post-9**: Refund/revert handling (reorg/failed tx) (system/internal)

### 3.4 Contributions + Revenue share (Marketplace loop)
- **UC-Contrib-1**: Submit contribution receipt (upload artifact → CID → tx)
- **UC-Contrib-2**: Owner dashboard: view submitted contributions + artifact
- **UC-Contrib-3**: Accept contribution + assign shareBps
- **UC-Contrib-4**: Reject contribution
- **UC-Contrib-5**: Revenue recipients update & audit (snapshot/version)
- **UC-Contrib-6**: Withdraw earnings (pull-payment)

### 3.5 Profile & reputation
- **UC-Profile-1**: View creator profile (posts, revenue, buyers count optional)
- **UC-Profile-2**: View contributor profile (accepted contributions, portfolio receipts)
- **UC-Profile-3**: View Q&A stats (questions asked, accepted answers, earned/spent)
- **UC-Profile-4**: Reputation signals (anti-wash) (v2)

### 3.6 Internal / Ops / Integrity
- **UC-Ops-1**: Indexer backfill / reconcile from block range
- **UC-Ops-2**: Retry IPFS fetch/pin failures
- **UC-Ops-3**: Monitoring dashboards + alerting
- **UC-Ops-4**: Security incident response (key issuance audit, abuse review)

---

## 4) Feature breakdown (Epics → Features) — MVP vs V2+

### Epic QA — Paid questions & rewards
- **MVP**
  - Create question (pay escrow), submit answer, vote, resolve after deadline, auto payout
  - Feed/detail, tags, basic search
  - Deadline + refund (recommended)
- **V2+**
  - Sybil-resistant voting (stake-based / reputation-weighted), dispute/arbitration
  - Advanced anti-spam: stake, fee market, stronger heuristics

### Epic Post — Posts/Courses (free/premium) + revisions
- **MVP**
  - Create free/premium, revisions, preview
  - Purchase access, read premium (decrypt client-side)
- **V2+**
  - Bundles/subscriptions, dynamic pricing, referrals
  - Decentralized key delivery (Lit/Threshold)

### Epic Contrib — Contribution marketplace + revenue split
- **MVP**
  - Submit receipt CID, accept/reject, shareBps assignment
  - Revenue recipients + withdraw
- **V2+**
  - Dispute system, automated quality signals, anti-spam fee/stake

### Epic Indexer — correctness & reliability
- **MVP**
  - Confirmations N, idempotency ledger, basic retry
- **V2+**
  - Full reorg rollback strategy, richer reconciliation, multi-chain adapters

### Epic Ops — security & production readiness
- **MVP**
  - Auth nonce anti-replay, rate limit, health checks, backups
- **V2+**
  - Advanced observability, WAF rules, anomaly detection

---

## 5) Decide early (to avoid design drift)

### Q&A payout resolution (must decide for MVP)
- Winner rule: vote-based; tie-break? (how to handle ties)
- Có **deadline** không? (đã có) Rule fallback khi `voteCount=0` là gì?
- Resolve gọi bởi ai? (permissionless + keeper/bot)
- Minimum bounty? Platform fee? (to reduce wash and spam)

### Premium key delivery (already defined in docs)
- Key per-post hay per-revision?
- Key Service trả plaintext key hay encrypted-to-buyer?

---

## 6) Tài liệu liên quan

- Overview: `docs/01-overview.md`
- Architecture: `docs/02-architecture.md`
- Data model (posts/access/contrib): `docs/03-data-model.md`
- Usecases (base): `docs/04-usecases.md`
- Flows (premium/indexer): `docs/05-flows.md`
- Features: `docs/06-features.md`
- Risks: `docs/08-risks-hard-parts.md`
- Encryption: `docs/spec/encryption-and-keys.md`
- Events: `docs/spec/events.md`
- Flow design (Q&A + premium): `docs/flows/flows.md`

