# 07) Implementation plan — Approach, milestones, timeline estimate

## 1. Recommended approach (build order)
Build with the principle: **read paths first**, then **write paths**, then **hardening**.
- Q&A feed + question detail (DB/API) → visible product early.
- Q&A contracts (create/answer/vote/resolve) + indexer → create the core user loop.
- Premium encryption + purchase + key delivery → “wow” moment.
- Contributions + accept + revenue split → marketplace loop.
- Indexer hardening + backfill → correctness.

## 2. Milestones (MVP)
> Rough estimate for a team of 1–2 full-time devs. If solo, expect the “stretch” timeline.

### Week 0.5–1 — Spec lock + scaffolding
- Finalize event names + payloads:
  - Q&A: `QuestionCreated`, `AnswerSubmitted`, `VoteCast`, `QuestionResolved`
  - Content: `PostCreated`, `PostEdited`, `AccessPurchased`, `ContributionSubmitted`, `ContributionAccepted`
- Finalize encryption format (alg, nonce encoding, payload schema)
- Setup repo structure + docker-compose (Postgres + API + indexer)

### Week 1–2 — Off-chain core (read path)
- Postgres migrations (users + Q&A + posts/revisions/access/contributions/events)
- API read endpoints: Q&A feed/detail, post feed/detail, profile
- Frontend: Q&A feed + question page + answer list, basic post feed + preview

### Week 2–3 — Contracts v1 + indexer MVP
- Contracts:
  - Q&A: create question (escrow), submit answer, vote, resolve (auto payout)
  - Content: create post, purchase access, events
- Indexer: subscribe logs, confirmations, upsert DB
- Admin tooling: reindex from block N

### Week 3–4 — Premium end-to-end (paywall)
- FE encryption + upload ciphertext
- Key service MVP (nonce + sig + verify access)
- FE decrypt rendering + purchase UX states

### Week 3–4 (parallel) — AI UX for Q&A (non-payout)
- Ranking answers (AI suggested)
- Thread summary + highlights
- Guardrails: AI read-only, never triggers payouts

### Week 4–5 — Contribution marketplace
- Submit contribution flow + dashboard
- Accept flow + shareBps assignment
- Revenue recipients materialization

### Week 5–6 — Revenue split + withdrawals + hardening
- Pull payments withdraw UI
- Rate limiting, caching, metrics
- Backfill, retry strategy, IPFS fallback gateways

## 3. Deliverables checklist
- Working demo: create question → answer → vote → resolve → auto payout.
- Working demo: create premium post → purchase → decrypt read.
- Contribution accepted changes revenue split.
- Profile shows earnings & accepted contributions.

## 4. Time estimate summary
- **Best case (2 dev)**: 4–6 tuần.
- **Solo dev**: 6–10 tuần (indexer + contracts + FE + ops sẽ kéo dài).

