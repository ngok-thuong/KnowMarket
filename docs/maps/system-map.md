# System map (C4-lite) — Web3 Q&A + Premium

## Big picture

```mermaid
flowchart LR
  subgraph FE[Frontend (Next.js)]
    UI[UI: Q&A / Courses / Profile]
    WAL[Wallet]
  end

  subgraph CHAIN[EVM Chain]
    QA[Q&A Contract\nescrow+answers+voting+resolve]
    CNT[Content Contract\nposts+access+revenue]
  end

  subgraph OFF[Off-chain]
    API[API (Golang)\nread models + auth + WS]
    IX[Indexer (worker)\nN conf + idempotent]
    DB[(Postgres)]
    IPFS[(IPFS)]
    KS[Key Service (MVP)\nkey delivery]
    AIS[AI Service (UX-only)\nrank/summary/highlight]
  end

  UI -- sign tx --> WAL
  WAL -- tx --> QA
  WAL -- tx --> CNT

  QA -- events --> IX
  CNT -- events --> IX
  IX -- upsert --> DB

  UI -- REST/WS --> API
  API -- query --> DB
  API -- fetch/pin --> IPFS

  UI -- fetch CIDs --> IPFS
  UI -- prove access(sig) --> KS
  KS -- verify --> DB
  KS -- key --> UI

  UI -- request UX assist --> AIS
  AIS -- read-only --> DB
```

## Responsibility table

| Component | Does | Does not |
|----------|------|----------|
| **Frontend** | Draft content, upload CIDs, vote UI, purchase UI, decrypt premium | Does not decide payouts |
| **Q&A Contract** | Escrow bounty, record votes, resolve + payout | Does not call AI |
| **Content Contract** | Post registry, access purchase, revenue split | Does not store premium plaintext |
| **Indexer** | Events → DB, confirmations/reorg, idempotency | Does not serve API directly |
| **API** | Read endpoints + auth + WS | Not the source of truth |
| **IPFS** | Stores content CIDs | Does not enforce access |
| **Key Service (MVP)** | Delivers premium keys after verifying access | Cannot prevent leaks 100% |
| **AI Service** | Ranking/summary/highlight (UX) | **Never** affects payouts |

