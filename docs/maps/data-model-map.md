# Data model map — Entities & relationships

## ER-ish overview (logical)

```mermaid
erDiagram
  USERS ||--o{ POSTS : creates
  POSTS ||--o{ POST_REVISIONS : has
  POSTS ||--o{ POST_ACCESS : grants
  POSTS ||--o{ CONTRIBUTIONS : receives
  POSTS ||--o{ REVENUE_RECIPIENTS : pays

  USERS ||--o{ QUESTIONS : asks
  QUESTIONS ||--o{ ANSWERS : has
  QUESTIONS ||--o{ ANSWER_VOTES : receives
  ANSWERS ||--o{ ANSWER_VOTES : receives

  CHAIN_EVENTS ||--o{ FAILED_EVENTS : may_create
```

## On-chain vs off-chain

| Object | On-chain (source of truth) | Off-chain (read model) |
|--------|----------------------------|-------------------------|
| Q&A | bounty escrow, votes, resolve | `questions/answers/answer_votes` |
| Premium | access purchase, recipients | `posts/post_access/revenue_recipients` |
| Content | CID pointers, revisions | cached metadata, previews |

