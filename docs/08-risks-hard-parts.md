# 08) Risks & Hard parts — What will be hardest (and how to handle)

## 0. New hard part (for this project): Voting payout when userbase is small
### Why hard
- MVP rule “1 wallet = 1 vote” is **not Sybil-resistant** when the project is still small.
- With low bounties, users can “self-ask → self-answer → self-vote” to farm reputation (funds may just cycle minus fees).

### MVP mitigation (pragmatic)
- Require **minimum bounty** + platform fee (make wash less attractive).
- Deadline + permissionless `resolve()` + keeper to avoid stuck escrow.
- Deadline + permissionless `resolve()` + keeper to avoid stuck escrow.
- Abuse monitoring: detect patterns (wallet clusters, repeated self-loops) and flag (off-chain).

### V2 mitigation (stronger)
- Stake-based / reputation-weighted voting.
- Dispute/arbitration for high bounties.

## 1. Hardest problem #1: Premium content access (keys) without “too much trust”
### Why hard
- You must ensure “paid users can read” while preventing arbitrary key leaks.
- Web3 has no perfect DRM; you only get access control + incentives.

### MVP mitigation (acceptable)
- Key Service cấp key sau khi verify:
  - signature nonce (proof wallet ownership)
  - access confirmed in DB (fast) + chain read fallback (safety)
- Audit logs: key issuance metadata (off-chain) to trace abuse.

### V2 mitigation (more decentralized)
- Lit/Threshold: key encrypted to buyer; platform doesn't hold plaintext keys.

## 2. Hardest problem #2: Indexer correctness (confirmations, reorg, idempotency)
### Why hard
- Missed/duplicate events → wrong access, wrong revenue splits (high sensitivity).

### Mitigation
- Unique key `(chain_id, tx_hash, log_index)` for every event.
- Wait N confirmations before marking `confirmed`.
- Backfill job + safe checkpoint.
- Monitoring: lag blocks, error rate.

## 3. Hardest problem #3: Revenue split evolution
### Why hard
- When contributions are accepted, recipients change.
- You must define clearly: **from which point in time does a split apply**.

### Mitigation (clear rule)
- MVP rule: the “current recipients” split applies to purchases from block X onward.
- Store a `split_version` snapshot per post for auditing.

## 4. Abuse vectors
- **Spam contributions**: mitigate via fee/stake + rate limits + reviewer allowlists.
- **Wash purchasing**: users buying their own content to inflate stats → reputation scoring must account for self-wash.
- **Key sharing**: not fully preventable; reduce via pricing + watermarking (optional) + reputation.

## 5. UX risks
- Pending states: tx pending + indexer lag → clear UX states (pending/confirmed/reverted).
- Wallet friction: login/allowance UX for ERC20.

## 6. Security notes (baseline)
- Contracts: pull payments, re-entrancy guards, safe ERC20.
- API: signature replay protection (nonce, expiry).
- Keys: never log plaintext key; rotate secrets; encrypt at rest if stored.

