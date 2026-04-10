# 02) Architecture — Services, Boundaries, Trust Assumptions

## 1. High-level architecture

```mermaid
flowchart LR
  subgraph FE[Frontend (Next.js)]
    W[Wallet]
    UI[UI: Q&A / courses / profile]
  end

  subgraph CHAIN[EVM Chain]
    C1[Q&A Contract: escrow + answers + voting + resolve]
    C2[Content Contract: posts + access + revenue split]
  end

  subgraph OFF[Off-chain]
    API[API Service (Golang)]
    IDX[Indexer (Golang worker)]
    DB[(Postgres)]
    IPFS[(IPFS: content CIDs)]
    KS[Key Service (MVP)]
    AI[AI Service (UX-only)]
  end

  UI -- REST/WS --> API
  UI -- tx/sign --> W
  W -- tx --> C1
  W -- tx --> C2
  C1 -- events --> IDX
  C2 -- events --> IDX
  IDX -- upsert/aggregate --> DB
  API -- query --> DB
  API -- fetch/pin --> IPFS
  UI -- fetch ciphertext --> IPFS
  UI -- "prove access (sig)" --> KS
  KS -- "deliver key" --> UI
  KS -- verify access --> API
  API -- chain read (optional) --> C1
  API -- chain read (optional) --> C2

  UI -- "request ranking/summary" --> AI
  AI -- "read-only" --> DB
```

## 2. Components
### 2.1 Frontend
- Wallet connect + sign-in (signature challenge).
- Q&A:
  - Create question (lock bounty, set deadline).
  - Submit answer (CID), vote, resolve status UI.
- Create free/premium post:
  - Free: upload plaintext JSON → IPFS CID.
  - Premium: encrypt → upload ciphertext → IPFS CID.
- Purchase access (tx).
- Read premium: fetch ciphertext + request key + decrypt client-side.
- Contribute: submit CID + tx.

### 2.2 Smart contracts (EVM)
MVP contracts responsibilities:
#### Q&A contract
- **Escrow**: lock bounty when creating a question.
- **Answers**: submit answer CID.
- **Voting**: record votes (MVP: 1 wallet = 1 vote).
- **Resolve**: after deadline, choose winner by votes and **auto payout**.

#### Content contracts (existing scope)
- **Post registry**: `postId → creator, isPremium, price, contentCipherCid/currentRevisionCid`.
- **Access**: `hasAccess(postId, buyer)` set true on purchase.
- **Revenue split**:
  - Track recipients & shares (bps).
  - Pull payments: `withdraw()` for recipients.
- Emit events as the “source of truth” for the indexer.

### 2.3 Indexer
- Subscribe logs, wait confirmations, decode events.
- Idempotent processing (unique by `chain_id + tx_hash + log_index`).
- Fetch/pin content from IPFS (ciphertext or plaintext).
- Upsert DB models; publish WS events (optional) via API.

### 2.4 API service
- Read APIs (feed, post detail, profile, stats).
- Write APIs (off-chain only): upload helper, encryption helper (optional), moderation.
- Auth: verify wallet signature (session/JWT).
- WebSocket: push updates (new posts, purchase confirmed, contribution accepted).

### 2.5 AI Service (UX-only)
- Read-only service to:
  - Rank answers (AI suggested)
  - Summarize answers thread
  - Highlight why A may be better than B
- **Non-goal**: AI must not trigger payouts or alter on-chain outcomes.

### 2.6 Key Service (MVP)
Trusted component that delivers the decryption key after a confirmed purchase.
- Verify:
  - buyer signs nonce
  - DB/indexer recorded confirmed purchase **or** API checks `hasAccess` on-chain
- Deliver key:
  - simplest: return symmetric key (not ideal but MVP)
  - better: return key encrypted to buyer’s public key (still MVP-friendly)

## 3. Trust assumptions (explicit)
- **MVP assumes** the Key Service does not cheat or leak keys on purpose.
- Indexer & DB may lag, but must not be wrong: idempotency + backfill.
- Users can leak plaintext after decrypt; the system controls **access**, not **non-copy**.
- AI service can be wrong about ranking/summary; it only affects UX, not payouts.

## 4. Design constraints
- Never put premium plaintext on IPFS.
- Minimize chain reads in API hot paths (expensive/slow) → prefer event-driven + cached DB.
- Reorg handling: only treat as “confirmed” after N blocks.

## 5. Suggested repo structure
- `api/`: Golang HTTP + WS
- `indexer/`: Golang worker
- `contracts/`: Solidity + deployments
- `frontend/`: Next.js
- `docs/`: specs
- `infra/`: docker-compose, k8s manifests (optional)

