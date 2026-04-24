# Blockchain (EVM / Solidity)

## Purpose
- Solidity smart contracts on EVM (target: Base/Arbitrum) for:
  - Bounty Q&A (ask/answer/vote/resolve/claim/refund)
  - Posts (premium paywall / access purchase)
  - Contributions (submit/accept + revenue split + withdrawals)
- Emits events that the `event/` indexer writes into Postgres.

## Structure
- `contracts/`: Solidity contracts
- `script/` or `scripts/`: deploy scripts (tool-dependent)
- `test/`: contract tests (tool-dependent)

## Event contract
Keep event schema consistent with `docs/spec/events.md`.

## Local development
The repo is tool-agnostic; use either Foundry or Hardhat.

Foundry example:

```bash
cd blockchain
forge build
forge test
```

