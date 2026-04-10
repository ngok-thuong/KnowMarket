# Event schema (EVM) — Source of truth for indexer

## Conventions
- `questionId`: `uint256`
- `answerId`: `uint256`
- `postId`: `uint256`
- `token`: `address` (ERC20), use `address(0)` for native token (optional)
- `amount`: `uint256`
- `cid`: string (IPFS CIDv1)
- `kind`: `uint8` enum
- Events should include enough data so the indexer does **not** need many contract reads.

## Events

## Q&A (bounty + voting + resolve)

### `QuestionCreated`
Emitted when a question is created and the bounty is locked in escrow.
- `questionId (uint256)`
- `asker (address)`
- `bountyToken (address)`
- `bountyAmount (uint256)`
- `questionCid (string)` — IPFS CID (plaintext)
- `deadline (uint64)` — unix timestamp

### `AnswerSubmitted`
Emitted when an answer is submitted.
- `questionId (uint256)`
- `answerId (uint256)`
- `answerer (address)`
- `answerCid (string)` — IPFS CID (plaintext)

### `VoteCast`
Emitted when a vote is cast.
- `questionId (uint256)`
- `answerId (uint256)`
- `voter (address)`
- `direction (int8)` — +1 upvote, -1 downvote (downvote optional MVP)
- `weight (uint32)` — MVP=1, V2 stake/reputation-based

### `QuestionResolved`
Emitted when a question is resolved after the deadline.
- `questionId (uint256)`
- `winnerAnswerId (uint256)` — 0 if no winner (fallback)
- `winner (address)` — `address(0)` if no winner
- `payoutToken (address)`
- `payoutAmount (uint256)`
- `resolution (uint8)` — 0=winner_by_votes,1=refunded,2=treasury,3=extended (example)

### `PostCreated`
Emitted when a post is created (free or premium).
- `postId (uint256)`
- `creator (address)`
- `accessType (uint8)` — 0=free, 1=premium
- `priceToken (address)` — if premium
- `priceAmount (uint256)` — if premium
- `contentCid (string)` — free: plaintext CID; premium: ciphertext CID
- `previewCid (string)` — optional, preview plaintext CID (excerpt/metadata)

### `PostEdited`
Emitted when a new revision is published.
- `postId (uint256)`
- `editor (address)` — usually creator or authorized role
- `newContentCid (string)`
- `revision (uint32)` — monotonically increasing

### `AccessPurchased`
Emitted when someone purchases access.
- `postId (uint256)`
- `buyer (address)`
- `priceToken (address)`
- `priceAmount (uint256)`

### `ContributionSubmitted`
Emitted when a contributor submits a receipt CID.
- `postId (uint256)`
- `contributionId (uint256)`
- `contributor (address)`
- `kind (uint8)` — 0=edit,1=research,2=code,3=translation,4=other
- `artifactCid (string)`

### `ContributionAccepted`
Emitted when a contribution is accepted and assigned share.
- `postId (uint256)`
- `contributionId (uint256)`
- `acceptedBy (address)`
- `shareBps (uint16)` — 0..10000

### `RecipientsUpdated` (optional but helpful)
If revenue recipients are updated on-chain.
- `postId (uint256)`
- `version (uint32)`

## Indexer requirements
- Idempotency key: `(chain_id, tx_hash, log_index)`
- Confirmations: wait N blocks before marking `confirmed`
- Reorg: if reverted, mark affected rows `reverted` and backfill from safe checkpoint

