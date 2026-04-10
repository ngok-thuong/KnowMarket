# 06) Feature breakdown — Epics → Features → Deliverables

## Epic QA — Q&A (paid ask + voting payout) + AI UX
- **QA1 Create question (lock bounty)**
  - FE editor + upload `questionCid` (optional), on-chain `QuestionCreated`
  - Deadline required; pending/confirmed UX
- **QA2 Submit answer**
  - upload answer plaintext → IPFS CID, on-chain `AnswerSubmitted`
- **QA3 Voting**
  - 1 wallet = 1 vote (MVP), `VoteCast` event
  - anti-spam basics + rate limiting in API (read path)
- **QA4 Resolve + auto payout**
  - permissionless `resolve(questionId)` after deadline, emits `QuestionResolved`
  - keeper/bot to ensure finalize
- **QA5 AI UX (non-payout)**
  - rank answers, summarize thread, highlight differences
  - AI does not influence on-chain outcome

## Epic A — Posts (free/premium) + revisions
- **A1 Create post (free)**
  - FE editor, upload plaintext to IPFS, on-chain PostCreated (optional for free)
  - API feed/detail
- **A2 Create post (premium)**
  - client-side encryption, upload ciphertext, on-chain PostCreated
  - preview/excerpt stored off-chain
- **A3 Edit post (revision)**
  - new revision CID + PostEdited event
  - history viewer (optional MVP)
- **A4 Visibility**
  - public/unlisted/hidden; moderation hooks

## Epic B — Premium access (paywall)
- **B1 Purchase access**
  - ERC20 payment, AccessPurchased event, hasAccess mapping
- **B2 Read premium**
  - fetch ciphertext, request key, decrypt, render
- **B3 Key delivery (MVP)**
  - nonce + signature auth
  - access verification from DB (fast) + chain fallback (safety)
- **B4 Access UX**
  - pending purchase, confirmed purchase, error/retry

## Epic C — Contribution marketplace
- **C1 Submit contribution**
  - upload artifact CID, on-chain submit, DB record
- **C2 Review UI**
  - owner dashboard: list submitted contributions, view artifact
- **C3 Accept/reject**
  - assign shareBps; update recipients
- **C4 Anti-spam**
  - optional fee/stake, rate limiting

## Epic D — Revenue split + withdrawals
- **D1 Revenue recipients**
  - creator share + platform fee + accepted contributions shares
- **D2 Pull payments**
  - withdraw UI
- **D3 Accounting views**
  - earnings by post, earnings timeline

## Epic E — Indexer integrity
- **E1 Event ingestion**
  - confirmations N, idempotency, retries
- **E2 Backfill**
  - command to rebuild from block range
- **E3 Monitoring**
  - lag metrics, error rates

## Epic F — Profiles + reputation
- **F1 Creator profile**
  - posts, revenue, buyers count (optional)
- **F2 Contributor profile**
  - accepted contributions, earned share, portfolio receipts
- **F3 Reputation signals**
  - accepted rate, earnings, category tags

## Epic G — Platform ops (must-have for production)
- **G1 Auth + sessions**
- **G2 Rate limit + abuse**
- **G3 Observability**
- **G4 Backups**

