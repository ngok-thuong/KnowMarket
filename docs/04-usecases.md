# 04) Use-cases — Actor map, scenarios, and feature slicing

## 1. Actors
- **Guest**: not connected.
- **User (wallet owner)**: asker/answerer/voter/reader/buyer/creator/contributor.
- **Asker**: creates questions and locks bounties.
- **Answerer**: submits answers.
- **Voter**: votes to select the winner.
- **Creator/Owner**: creates posts.
- **Contributor**: submits contributions.
- **Reviewer** (optional): accepts contributions on behalf of the owner.
- **Platform**: API/indexer/key service.

## 2. Use-case inventory (high level)
### Q&A (paid ask + voting payout)
- **UC0**: Browse Q&A feed
- **UC0.1**: Create question (lock bounty + deadline)
- **UC0.2**: Submit answer (CID)
- **UC0.3**: Vote answers (1 wallet = 1 vote)
- **UC0.4**: Resolve after deadline + auto payout (permissionless/keeper)

### Content
- **UC1**: Browse feed (free + premium preview)
- **UC2**: Read free post
- **UC3**: Create free post
- **UC4**: Edit post (revision)

### Premium access
- **UC5**: Create premium post (encrypted)
- **UC6**: Purchase access to premium post
- **UC7**: Read premium post (decrypt client-side)
- **UC8**: Refund/revert handling (reorg / failed tx) (system/internal)

### Contribution marketplace
- **UC9**: Submit contribution to a post
- **UC10**: Review/accept contribution
- **UC11**: Revenue split update after acceptance

### Reputation / Profile
- **UC12**: View creator profile + earnings + accepted contributions
- **UC13**: View contributor portfolio (proof receipts)

### Ops / integrity
- **UC14**: Indexer backfill / reconcile (internal)
- **UC15**: Handle IPFS fetch failure & retry (internal)

## 3. Detailed use-cases (analysis)

### UC0.1 — Create question (lock bounty + deadline)
- **Goal**: create a question and lock a USDC bounty to attract answers.
- **Preconditions**:
  - asker has a wallet and is signed-in (signature).
  - sufficient balance & allowance (ERC20).
- **Main flow**:
  1) FE drafts the question (title/body/tags) → upload to IPFS → `questionCid` (recommended).
  2) FE calls `createQuestion(bountyToken, bountyAmount, questionCid, deadline)`.
  3) Contract transferFrom → escrow, emits `QuestionCreated`.
  4) Indexer ingests after N confirmations → DB upserts question status=`open`.
- **Failure modes**:
  - question spam → mitigate via minimum bounty + rate limits + fees.
  - indexer lag → pending/confirmed UX states.

### UC0.2 — Submit answer (free)
- **Goal**: submit an answer without paying (besides gas).
- **Main flow**:
  1) FE uploads plaintext answer → IPFS → `answerCid`.
  2) FE calls `submitAnswer(questionId, answerCid)` → emits `AnswerSubmitted`.
  3) Indexer ingests → DB inserts answer status=`submitted`.

### UC0.3 — Vote + AI hỗ trợ UX
- **Goal**: vote to select the winner; AI helps users read faster.
- **Main flow**:
  1) Voter calls `vote(questionId, answerId, dir)` (MVP: weight=1).
  2) Indexer ingests `VoteCast` → updates aggregates.
  3) AI (off-chain) reads answers + votes to:
     - produce ranking (AI suggested)
     - summarize the thread
     - highlight differences
  4) **AI does not decide payouts**.

### UC0.4 — Resolve after deadline + auto payout
- **Goal**: after the deadline, finalize the question and pay the bounty to the winner.
- **Main flow**:
  1) Anyone/keepers call `resolve(questionId)`.
  2) Contract picks the winner by vote totals, transfers bounty → winner, emits `QuestionResolved`.
  3) Indexer ingests → DB marks resolved + winner.
- **Fallback decisions (must decide)**:
  - If `voteCount=0`: refund/treasury/extend.
  - If tie: tie-break rule.

### UC5 — Create premium post (encrypted)
- **Goal**: publish one premium post; only buyers can read the full content.
- **Preconditions**:
  - creator has a wallet and is signed-in (signature).
  - creator has token allowance (ERC20) to set pricing/payout (depending on design).
- **Main flow**:
  1) FE creates `content.json` (title/body/tags).
  2) FE generate `contentKey` (symmetric key).
  3) FE encrypt → `ciphertext` + `nonce` + `alg`.
  4) FE upload ciphertext → IPFS → `cipherCid`.
  5) FE calls `createPost(isPremium=true, price, token, cipherCid, previewCidOrPreviewHash)`.
  6) Indexer ingest `PostCreated` → upsert `posts` + `post_revisions` (rev=1, encrypted).
  7) API/FE show post in feed with preview.
- **Postconditions**:
  - premium post appears in the feed (preview).
  - full content is not readable unless purchased.
- **Failure modes**:
  - IPFS upload fail → retry.
  - tx fail → show failed state; content is still on IPFS but not “published”.
  - indexer lag → FE show “pending publish”.
- **Features involved**:
  - encryption on FE
  - IPFS upload
  - contract createPost + event ingestion
  - DB revision model

### UC6 — Purchase access to premium post
- **Goal**: pay and obtain access rights.
- **Preconditions**:
  - premium post exists; buyer has balance & allowance.
- **Main flow**:
  1) FE calls `purchaseAccess(postId)` (transfer/escrow).
  2) Indexer ingests `AccessPurchased(postId,buyer,amount)` after N confirmations.
  3) DB upsert `post_access` status=confirmed.
  4) FE calls Key Service: sends signature nonce.
  5) Key Service verify buyer + confirmed access → deliver key.
  6) FE fetch ciphertext from IPFS, decrypt, render.
- **Postconditions**:
  - buyer can read premium content.
  - payout is accounted for via the revenue split (pull payment).
- **Failure modes**:
  - reorg: purchase reverted → access revoked (status=reverted) → key service denies key.
  - key delivery fails → retry; buyer can request the key again later.
- **Features involved**:
  - payments + access registry
  - indexer confirmations/reorg handling
  - key service (auth by wallet signature)

### UC9 — Submit contribution
- **Goal**: contributor provides an artifact (CID) as proof-of-contribution.
- **Main flow**:
  1) Contributor upload artifact (diff/notes/file) → IPFS CID.
  2) Submit tx `submitContribution(postId, cid, kind)`.
  3) Indexer ingest → create `contributions` status=submitted.
  4) Owner/reviewer reviews and accept/rejects.
- **Failure modes**:
  - spam contributions → mitigate by fee/stake/rate limit.

### UC10 — Accept contribution + revenue share
- **Main flow**:
  1) Owner gọi `acceptContribution(postId, contributionId, shareBps)` (on-chain) hoặc off-chain (MVP variant).
  2) Indexer update contribution status=accepted + share.
  3) Update `revenue_recipients` for future payouts.
- **Hard decision**:
  - acceptance on-chain (verifiable, slower) vs off-chain (faster, needs trust).

## 4. Feature slicing (epics)
- **Epic A — Premium content**: encryption, purchase, key delivery, decrypt rendering.
- **Epic B — Posts & revisions**: create/edit, feed/detail, preview.
- **Epic C — Contributions**: submit, review, accept, share.
- **Epic D — Revenue & withdrawals**: split, accounting, withdraw UX.
- **Epic E — Indexer integrity**: confirmations, idempotency, backfill.
- **Epic F — Profiles & reputation**: earnings, accepted contributions, portfolio.

