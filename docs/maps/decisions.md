# Decision tables — Lock rules before coding contracts

## Voting rules (MVP → V2)

| Topic | MVP | V2+ |
|------|-----|-----|
| Vote weight | 1 wallet = 1 | stake-based / reputation-weighted |
| Downvote | optional | yes |
| Change vote | optional (overwrite) | yes (with constraints) |

## Resolve mechanics

| Topic | Recommended default | Why |
|------|----------------------|-----|
| Who can call `resolve()`? | permissionless + keeper bot | avoid stuck escrow |
| When can resolve? | `block.timestamp >= deadline` | deterministic |

## Tie-breaks

| Strategy | Rule | Trade-off |
|---------|------|----------|
| Earliest submission wins | pick the smallest `created_at` | easy but can be gamed by early spam |
| Most recent vote wins | use lastVoteTime | more complex, last-minute vote wars |
| Split payout | split bounty across top-k | complex contract + UX |

## No-vote fallback (0 votes)

| Strategy | Rule | Trade-off |
|---------|------|----------|
| Refund | refund bounty to asker (minus fee) | simplest, user-friendly |
| Treasury | send to treasury | funds the platform, may frustrate users |
| Extend | extend deadline once | delays UX, can still be 0 votes |

## AI boundaries (hard rule)

| Item | Allowed | Not allowed |
|------|---------|-------------|
| Ranking/summaries | ✅ | |
| “AI suggested” labels | ✅ (UX only) | |
| Trigger resolve/payout | | ❌ |
| Weight votes | | ❌ |

