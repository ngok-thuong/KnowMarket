# 05) Flows — End-to-end workflows + flowcharts

## 1. Publish premium post flow

```mermaid
sequenceDiagram
  autonumber
  participant U as Creator (Frontend)
  participant IPFS as IPFS
  participant CH as Contract
  participant IX as Indexer
  participant DB as Postgres
  participant API as API

  U->>U: Create content JSON
  U->>U: Generate contentKey + Encrypt content
  U->>IPFS: Upload ciphertext
  IPFS-->>U: cipherCid
  U->>CH: createPost(price, token, cipherCid, preview)
  CH-->>IX: PostCreated event
  IX->>IX: wait N confirmations
  IX->>DB: upsert posts + post_revisions(rev=1)
  API->>DB: query feed
  DB-->>API: premium post preview
  API-->>U: show in feed (preview)
```

## 2. Purchase + read premium post (MVP key server)

```mermaid
sequenceDiagram
  autonumber
  participant B as Buyer (Frontend)
  participant CH as Contract
  participant IX as Indexer
  participant DB as Postgres
  participant KS as Key Service
  participant IPFS as IPFS

  B->>CH: purchaseAccess(postId)
  CH-->>IX: AccessPurchased event
  IX->>IX: wait N confirmations
  IX->>DB: upsert post_access confirmed
  B->>KS: requestKey(postId, signedNonce)
  KS->>DB: verify confirmed access
  DB-->>KS: ok
  KS-->>B: deliver contentKey (MVP)
  B->>IPFS: fetch ciphertext by CID
  IPFS-->>B: ciphertext
  B->>B: decrypt + render
```

## 3. Contribution lifecycle

```mermaid
stateDiagram-v2
  [*] --> Submitted
  Submitted --> Accepted: owner/reviewer accepts\n(shareBps assigned)
  Submitted --> Rejected: owner/reviewer rejects
  Accepted --> [*]
  Rejected --> [*]
```

## 4. Indexer ingestion flow (idempotent)

```mermaid
flowchart TD
  A[Receive event log] --> B{Seen (chain_id, tx_hash, log_index)?}
  B -- yes --> Z[Skip]
  B -- no --> C[Insert chain_events row]
  C --> D{Event type}
  D -- PostCreated/PostEdited --> E[Upsert posts + revisions]
  D -- AccessPurchased --> F[Upsert post_access confirmed]
  D -- ContributionSubmitted --> G[Insert contribution submitted]
  D -- ContributionAccepted --> H[Mark accepted + update recipients]
  E --> Y[Commit]
  F --> Y
  G --> Y
  H --> Y
  Y --> X[Publish WS notification (optional)]
```

## 5. Reorg handling (conceptual)
- Indexer only marks events “confirmed” after N confirmations.
- If a reorg is detected (block hash mismatch), it should:
  - rollback rows from orphaned blocks (or mark them `reverted`)
  - backfill from a safe checkpoint

