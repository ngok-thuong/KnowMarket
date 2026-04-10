# Q&A core flow — Ask → Answer → Vote → Resolve → Payout

## Flowchart

```mermaid
flowchart TD
  A[Asker creates question\nlock bounty + deadline] --> B[Answers submitted\nCID/IPFS or text]
  B --> C[Voting period\n1 wallet = 1 vote]
  C --> D{Deadline reached?}
  D -- no --> C
  D -- yes --> E[Resolve (permissionless / keeper)]
  E --> F{Any valid votes?}
  F -- yes --> G[Winner = top votes\nAuto payout bounty]
  F -- no --> H[Fallback\nrefund / treasury / extend]
  G --> I[Question status = resolved]
  H --> I
```

## Sequence (on-chain + indexer)

```mermaid
sequenceDiagram
  autonumber
  participant As as Asker (FE)
  participant An as Answerer (FE)
  participant Vo as Voter (FE)
  participant CH as Q&A Contract
  participant IX as Indexer
  participant DB as Postgres
  participant AI as AI (UX-only)

  As->>CH: createQuestion(bounty, cid, deadline)
  CH-->>IX: QuestionCreated
  IX->>DB: upsert questions(open)

  An->>CH: submitAnswer(questionId, answerCid)
  CH-->>IX: AnswerSubmitted
  IX->>DB: insert answers(submitted)

  Vo->>CH: vote(questionId, answerId, dir)
  CH-->>IX: VoteCast
  IX->>DB: upsert votes + aggregates

  Note over AI: AI reads DB to compute ranking/summary/highlights
  AI-->>DB: store ai outputs (optional)

  Vo->>CH: resolve(questionId)
  CH-->>IX: QuestionResolved
  IX->>DB: mark resolved + winner + payout record
```

## State machine

```mermaid
stateDiagram-v2
  [*] --> Open
  Open --> Resolved: resolve() winner_by_votes
  Open --> Refunded: resolve() refunded
  Open --> Treasury: resolve() treasury
  Open --> Extended: resolve() extended
  Extended --> Open: extended_deadline
```

## AI UX guardrail

| AI output | Inputs | Impact |
|----------|--------|--------|
| Ranking | answers + votes | UX only |
| Summary | answers thread | UX only |
| Highlights | answer comparisons | UX only |

