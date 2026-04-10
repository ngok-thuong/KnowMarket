# Docs index — Web3 Q&A (Voting Payout) + Premium Content

## What this project is
This platform combines:
- **Bounty Q&A**: asking a question **locks a bounty** (USDC). Answers are **free**, and **voting selects the winner/payout** after the deadline.
- **Contribution marketplace**: task/contribution → review/accept → payout + reputation
- **Premium knowledge paywall**: long-form content is **paid**, **encrypted**, and access is granted per wallet.

## Read order (recommended)
1. `docs/01-overview.md` — vision, USP, scope (MVP vs v2)
2. `docs/02-architecture.md` — services, boundaries, trust assumptions
3. `docs/03-data-model.md` — Postgres tables + invariants
4. `docs/04-usecases.md` — use-case inventory + actor map
5. `docs/05-flows.md` — flows + mermaid diagrams
6. `docs/06-features.md` — feature breakdown (epics → features)
7. `docs/07-implementation-plan.md` — approach, milestones, estimated time
8. `docs/08-risks-hard-parts.md` — hardest problems + mitigation

## Notes
- These docs assume the stack: **Golang + Postgres + Indexer + EVM contracts + IPFS**.
- Paywalls **cannot prevent leaks 100%**; the goal is **valid access control** and leak reduction via encryption + access checks.
- **AI** is UX-only (ranking/summary/highlights) and **never** decides payouts.

