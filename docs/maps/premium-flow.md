# Premium flow — Create → Purchase → Key → Decrypt

## Sequence (MVP key service)

```mermaid
sequenceDiagram
  autonumber
  participant C as Creator (FE)
  participant IPFS as IPFS
  participant CC as Content Contract
  participant IX as Indexer
  participant DB as Postgres
  participant B as Buyer (FE)
  participant KS as Key Service (MVP)

  C->>C: generate contentKey + encrypt content
  C->>IPFS: upload ciphertext wrapper JSON
  IPFS-->>C: cipherCid
  C->>CC: createPost(price, token, cipherCid, previewCid)
  CC-->>IX: PostCreated
  IX->>DB: upsert posts + revisions(encrypted)

  B->>CC: purchaseAccess(postId)
  CC-->>IX: AccessPurchased
  IX->>DB: upsert post_access confirmed

  B->>KS: requestKey(postId, signedNonce)
  KS->>DB: verify confirmed access
  KS-->>B: deliver contentKey (MVP)

  B->>IPFS: fetch cipherCid
  B->>B: decrypt + render
```

## Trust boundaries

| Boundary | Assumption | Mitigation |
|----------|------------|------------|
| Key Service | Trusted in MVP (can leak keys) | audit logs, V2 threshold/Lit |
| IPFS | Public storage (ciphertext) | never store premium plaintext |
| Client | Can leak after decrypt | accepted non-goal (no DRM) |

