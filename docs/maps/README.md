# Docs maps — “read at a glance” (MVP)

The goal of `docs/maps/` is: **one file = one map** (1–2 diagrams + 1 table), faster to read and easier to maintain than long linear docs.

## Map index (recommended)

| Map | When to use it | Link |
|-----|----------------|------|
| **System map** | Understand how FE/Chain/Indexer/DB/IPFS/KeyService/AI connect | `docs/maps/system-map.md` |
| **Q&A core flow** | Ask → Answer → Vote → Resolve → Payout | `docs/maps/qa-flow.md` |
| **Premium flow** | Create premium → Purchase → Key → Decrypt | `docs/maps/premium-flow.md` |
| **Events → DB** | Implement indexer without getting the read model wrong | `docs/maps/events-to-db.md` |
| **Data model map** | See core tables + relationships | `docs/maps/data-model-map.md` |
| **Decision tables** | Lock in rules before coding contracts | `docs/maps/decisions.md` |

## Full docs (source of truth)
- Overview: `docs/01-overview.md`
- Architecture: `docs/02-architecture.md`
- Data model: `docs/03-data-model.md`
- Usecases: `docs/04-usecases.md`
- Flows (premium/indexer): `docs/05-flows.md`
- Feature list: `docs/06-features.md`
- Implementation plan: `docs/07-implementation-plan.md`
- Risks: `docs/08-risks-hard-parts.md`
- Events spec: `docs/spec/events.md`

