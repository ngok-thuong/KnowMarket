# 01) Overview — Web3 Q&A (Voting Payout) + Premium Content

## 1. Vision
Build a platform where:
- Users can **ask questions (Q&A)** by **locking a bounty** (USDC).
- Other users can **answer for free**.
- **Voting** selects the winning answer and **auto payout** happens after the deadline (not dependent on the asker).
- Users can publish **knowledge posts** (free or premium).
- Others can **contribute** (research/code/edit/translation) via a marketplace loop.
- Premium content is **encrypted**; only paying users can decrypt to read.
- Payouts/revenue splits are transparent via **on-chain escrow + events**, while UX stays fast via **indexer → Postgres → API**.

## 2. Why Web3 (USP vs web2)
- **Transparent escrow & payouts**: funds go to contracts, distributed by rules, withdrawn via pull-payment where applicable.
- **Attribution & revenue share**: contribution receipts (CID + wallet) enable revenue sharing.
- **Portable reputation**: profiles derive from verifiable on-chain events and payouts.
- **Permissionless resolution**: anyone/keepers can call `resolve()` after the deadline.

## 3. Scope definition
### 3.1 Core objects
- **Question**: a question with bounty + deadline.
- **Answer**: an answer linked to a question, stored as a CID (recommended).
- **Vote**: 1 wallet = 1 vote (MVP). V2: stake-based / reputation-weighted.
- **Post**: a knowledge post.
  - `free`: plaintext content on IPFS/DB.
  - `premium`: **encrypted** content; ciphertext on IPFS; access via on-chain payment.
- **Contribution**: contributions tied to a post (e.g., fixes, additions, translations, code snippets).
- **Purchase**: a transaction that buys premium access.

### 3.2 MVP (enough to ship)
- Q&A end-to-end: create question (lock bounty) → submit answers → vote → resolve after deadline → auto payout.
- Create posts (free/premium), edit via revisions.
- Upload content to IPFS (free: plaintext; premium: encrypted).
- Buy access (on-chain) → backend delivers key (MVP) → client decrypts and reads.
- Submit contributions (CID) → owner/reviewer accepts → assigns revenue share (bps).
- Revenue split + withdraw.
- Basic feed/list/search; basic profile + reputation.

### 3.3 V2+ (mở rộng)
- Sybil-resistant voting: stake-based / reputation-weighted; dispute/arbitration for high bounties.
- Decentralized key delivery (Lit/Threshold) instead of a key server.
- Dispute/arbitration for contribution acceptance.
- Dynamic pricing, subscriptions, bundles, referrals.
- Multi-chain adapter.

## 4. Non-goals (avoid scope blow-up)
- DRM chống copy tuyệt đối.
- On-chain lưu plaintext content.
- Full DAO governance ngay từ MVP.

## 5. Actors
- **Asker**: creates questions and locks bounties.
- **Answerer**: submits answers.
- **Voter**: votes on answers (1 wallet = 1 vote).
- **Creator/Owner**: creates posts, sets pricing, accepts contributions.
- **Reader/Buyer**: buys premium access.
- **Contributor**: submits contributions.
- **Reviewer** (optional MVP): can accept contributions on behalf of the owner.
- **Platform**: API/indexer/key service.

## 6. Key decisions (assumptions for docs)
- MVP targets **EVM** (Solidity) and uses **ERC20** (e.g. USDC) for payments.
- Indexer waits for **N confirmations** before marking events as confirmed.
- MVP uses a trusted **Key Service** to deliver decryption keys after verifying `hasAccess`.
- **Q&A payouts are decided by voting**; AI is UX-only (ranking/summary/highlights) and never participates in payouts.

