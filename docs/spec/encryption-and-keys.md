# Encryption & Key Delivery (MVP → V2)

## Goals
- Premium content **never** stored as plaintext on public storage (IPFS).
- Buyer can decrypt **client-side** after purchase is confirmed.
- MVP is shippable with a trusted Key Service; V2 reduces trust.

## Threat model (pragmatic)
- Cannot fully prevent a legit buyer from copying/leaking plaintext after decrypt.
- Must prevent non-buyers from decrypting ciphertext.
- Must prevent signature replay/key minting without on-chain access.

## Content format
### Plaintext (logical)
`content.json`:
- `title`
- `body_md`
- `tags[]`
- `attachments[]` (optional)

### Ciphertext payload on IPFS
Store a JSON wrapper so FE can decrypt consistently:
- `alg`: string (e.g. `xchacha20poly1305`)
- `nonce`: base64
- `ciphertext`: base64
- `aad`: optional (base64) — include `postId`, `revision` as associated data
- `schema_version`: int

## Key generation
- Generate per-post (or per-revision) symmetric key `contentKey`.
  - MVP simplest: one key per post, reused across revisions (easier UX).
  - Better: key per revision (limits blast radius if key leaks, more complexity).

## Key Service (MVP)
### API shape (suggested)
- `POST /keys/request`
  - input: `postId`, `walletAddress`, `nonce`, `signature`, `clientInfo`
  - output: `encryptedKey` (or `contentKey` in simplest MVP), `expiresAt`

### Verification steps
1) Validate nonce is fresh (stored server-side), single-use, short TTL.
2) Verify signature recovers `walletAddress`.
3) Verify access:
   - primary: DB says `post_access.confirmed=true`
   - fallback: call contract `hasAccess(postId, walletAddress)` (optional)
4) Issue key:
   - MVP baseline: return `contentKey` directly (fast, but weaker)
   - MVP improved: return `contentKey` encrypted to user (requires user pubkey flow)

### Logging requirements
- Never log plaintext keys.
- Log only key issuance metadata: `postId`, `wallet`, request_id, result.

## V2 (reduced trust) options
- Lit Protocol / Threshold: Key encrypted to buyer; service cannot read plaintext.
- On-chain “access NFT” as capability token (still needs encryption network).

