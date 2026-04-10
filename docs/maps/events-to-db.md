# Event → DB map — Indexer cheat sheet

## Q&A events → tables

| Event | DB tables touched | Notes |
|------|-------------------|------|
| `QuestionCreated` | `chain_events`, `questions` | status=`open`, store `deadline_at` |
| `AnswerSubmitted` | `chain_events`, `answers` | status=`submitted` |
| `VoteCast` | `chain_events`, `answer_votes` | unique `(question_id, voter_wallet)`; update aggregates |
| `QuestionResolved` | `chain_events`, `questions`, `answers` | set `winner_answer_id`; mark winner/lost |

## Content events → tables

| Event | DB tables touched |
|------|-------------------|
| `PostCreated` | `chain_events`, `posts`, `post_revisions` |
| `PostEdited` | `chain_events`, `post_revisions`, `posts.current_revision_id` |
| `AccessPurchased` | `chain_events`, `post_access` |
| `ContributionSubmitted` | `chain_events`, `contributions` |
| `ContributionAccepted` | `chain_events`, `contributions`, `revenue_recipients` |

## Idempotency + confirmations

| Rule | Implementation hint |
|------|---------------------|
| Idempotent | Unique `(chain_id, tx_hash, log_index)` in `chain_events` |
| Confirmations | mark “confirmed” only after N blocks |
| Reorg | mark affected rows reverted + backfill from safe checkpoint |

