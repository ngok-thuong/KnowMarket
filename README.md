# Web3 Q&A (Voting Payout) + Premium Content

This platform combines:
- **Bounty Q&A**: asking a question **locks a bounty (USDC)**, answering is **free**, and **voting** selects the winner with **auto payout** after the deadline.
- **Premium/Courses**: premium content is **encrypted**, stored as ciphertext on IPFS; users buy access on-chain and decrypt client-side (MVP uses a Key Service).
- **Contribution marketplace**: submit a receipt CID → accept + assign `shareBps` → revenue split + withdraw.
- **AI (UX-only)**: ranking/summary/highlights for faster reading, **never** participates in payouts.

## Structure
- `backend/`: Golang API service (Postgres)
- `frontend/`: Next.js frontend
- `event/`: indexer/worker for chain events → Postgres
- `contracts/`: (planned) EVM smart contracts (Q&A + Content)
- `docs/`: specs & flowcharts
- `docs/maps/`: “map pages” (diagram + table, quick to read)
- `infra/`: docker/deploy helpers

## Read me first (fast path)
1. `docs/maps/README.md`
2. `docs/maps/system-map.md`
3. `docs/maps/qa-flow.md`
4. `docs/maps/premium-flow.md`
5. `docs/maps/events-to-db.md`

## Full docs
Start at `docs/README.md`.

