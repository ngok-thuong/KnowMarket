export type BountyStatus = "open" | "resolved";

export type PlaceholderAnswer = {
  id: string;
  author: string;
  excerpt: string;
  body: string;
  votes: number;
  submittedAgo: string;
};

export type BountyPlaceholderDetail = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  bountyLabel: string;
  deadlineLabel: string;
  answers: number;
  votes: number;
  status: BountyStatus;
  chainLabel: string;
  questionCid: string;
  asker: string;
  answersList: PlaceholderAnswer[];
};

const BOUNTY_PLACEHOLDERS: readonly BountyPlaceholderDetail[] = [
  {
    id: "1",
    title: "Best practice for indexer idempotency with reorgs?",
    excerpt: "Looking for a concrete pattern for chain_events dedupe and safe replays on Base.",
    body: `We are wiring the indexer to Postgres with the invariant (chain_id, tx_hash, log_index) unique on chain_events.

On a reorg I want to mark affected rows reverted and replay from a safe checkpoint without double-counting votes or bounty state. What patterns have you shipped in production for EVM L2s with shorter finality than Ethereum L1?`,
    bountyLabel: "250 USDC",
    deadlineLabel: "Ends in 4d 12h",
    answers: 3,
    votes: 38,
    status: "open",
    chainLabel: "Base · Sepolia",
    questionCid: "bafyQUESTION001placeholderknowmarket",
    asker: "0x71C…9A3e",
    answersList: [
      {
        id: "a1",
        author: "0x4e2…c81B",
        excerpt: "We use a two-phase ingest: append-only chain_events, then a projection worker…",
        body: `We use a two-phase ingest: append-only chain_events, then a projection worker that applies events in block order. On reorg, we delete or tombstone rows from block_number >= fork_block for that chain_id, then replay from RPC at the safe head.

Idempotency is enforced by the unique key on (chain_id, tx_hash, log_index) so replays are no-ops for already-seen logs.`,
        votes: 18,
        submittedAgo: "2d ago",
      },
      {
        id: "a2",
        author: "0xbB1…402F",
        excerpt: "Store raw logs + block hash; compare parent hash when advancing…",
        body: `Store raw logs + block hash; compare parent hash when advancing the chain tip. If parent mismatch, walk back until you find common ancestor, mark forward branch as reverted, then catch up from the winning fork.

Heavy on RPC but simple to reason about for MVP.`,
        votes: 11,
        submittedAgo: "3d ago",
      },
      {
        id: "a3",
        author: "0x88d…01aa",
        excerpt: "Consider subscribing to a reorg-safe WS provider and keep a small ring buffer…",
        body: `Consider subscribing to a reorg-safe WS provider and keep a small ring buffer of recent blocks. Your API should never read “confirmed” state until N confirmations from the indexer config match the row status.

For Q&A vote counts we recompute from answer_votes after every ingest batch.`,
        votes: 9,
        submittedAgo: "4d ago",
      },
    ],
  },
  {
    id: "2",
    title: "How should premium AAD bind postId:revision without leaking metadata?",
    excerpt: "XChaCha envelope design — is a single string AAD enough for revision rollback safety?",
    body: `Spec locks AAD to postId:revision as UTF-8 bytes. I worry about ambiguity if revision is ever reset or mirrored across chains.

Is a single concatenated AAD enough, or should we include chain_id and contract address in AAD while keeping IPFS ciphertext identical across mirrors?`,
    bountyLabel: "120 USDC",
    deadlineLabel: "Ends in 1d 3h",
    answers: 2,
    votes: 12,
    status: "open",
    chainLabel: "Arbitrum",
    questionCid: "bafyQUESTION002placeholderknowmarket",
    asker: "0x2F0…77d1",
    answersList: [
      {
        id: "a1",
        author: "0xcC3…91e0",
        excerpt: "Keep AAD minimal per spec; put chain + contract in the plaintext JSON schema version…",
        body: `Keep AAD minimal per spec; put chain + contract in the plaintext JSON schema_version envelope on IPFS if you need binding beyond postId:revision.

Changing AAD breaks decryption for old buyers — so only bump revision when ciphertext changes.`,
        votes: 7,
        submittedAgo: "8h ago",
      },
      {
        id: "a2",
        author: "0x19a…55cC",
        excerpt: "If you need cross-chain uniqueness, fork the spec in docs — don’t silently widen AAD…",
        body: `If you need cross-chain uniqueness, fork the spec in docs — don’t silently widen AAD without bumping schema_version and migrating keys.

Clients should verify AAD bytes before decrypt and reject mismatch.`,
        votes: 5,
        submittedAgo: "1d ago",
      },
    ],
  },
  {
    id: "3",
    title: "Pull-payment revenue split vs push — gas tradeoffs at ~10 recipients?",
    excerpt: "MVP caps recipients; still want a sanity check on withdraw() batching UX.",
    body: `We want pull-only withdrawals per recipient per post. With up to 10 contributors plus creator and platform, is it acceptable UX if each recipient pays their own gas on first withdraw?

Any patterns for surfacing “you have a claim” in the UI without polling the contract every load?`,
    bountyLabel: "500 USDC",
    deadlineLabel: "Ended · awaiting resolve",
    answers: 2,
    votes: 36,
    status: "open",
    chainLabel: "Base",
    questionCid: "bafyQUESTION003placeholderknowmarket",
    asker: "0x60B…e4D2",
    answersList: [
      {
        id: "a1",
        author: "0x7aa…33F0",
        excerpt: "Pull is the right default; index pendingWithdraw in Postgres from events…",
        body: `Pull is the right default; index pendingWithdraw in Postgres from events and show a banner when wallet matches a recipient with non-zero owed.

Gas is paid once per recipient; that’s fair and avoids reentrancy footguns from push loops.`,
        votes: 22,
        submittedAgo: "12h ago",
      },
      {
        id: "a2",
        author: "0x0d4…bE19",
        excerpt: "You can expose a multicall read for batch balances if you want fewer RPC round-trips…",
        body: `You can expose a multicall read for batch balances if you want fewer RPC round-trips on the client. Still keep writes as individual withdraw() calls.`,
        votes: 14,
        submittedAgo: "1d ago",
      },
    ],
  },
  {
    id: "4",
    title: "SIWE nonce storage: Redis vs Postgres for single-use TTL?",
    excerpt: "Auth path already on Postgres; wondering if Redis is worth the extra moving part.",
    body: `Nonce is UUID, 5-minute TTL, delete on successful verify. Traffic is modest (<1000 logins/day). Stack is already Postgres + API in Go.

Redis would add another failure mode. Is there a strong reason to prefer Redis for nonce churn?`,
    bountyLabel: "80 USDC",
    deadlineLabel: "Resolved 2d ago",
    answers: 2,
    votes: 21,
    status: "resolved",
    chainLabel: "Base · Sepolia",
    questionCid: "bafyQUESTION004placeholderknowmarket",
    asker: "0x9Ee…2B90",
    answersList: [
      {
        id: "a1",
        author: "0xf01…cD44",
        excerpt: "Postgres is enough — index nonce id + expires_at, delete row on verify…",
        body: `Postgres is enough — index nonce id + expires_at, delete row on verify. Run a small cron or partman to partition old rows if you worry about table bloat.

Redis shines at cross-region rate limits; for single-region auth I’d skip it until you measure lock contention.`,
        votes: 12,
        submittedAgo: "5d ago",
      },
      {
        id: "a2",
        author: "0x22c…88A1",
        excerpt: "If you add Redis later, use it only as cache with PG as source of truth…",
        body: `If you add Redis later, use it only as cache with PG as source of truth so you don’t split brain on nonce consumption.`,
        votes: 9,
        submittedAgo: "5d ago",
      },
    ],
  },
];

export function listBountyPlaceholders(): readonly BountyPlaceholderDetail[] {
  return BOUNTY_PLACEHOLDERS;
}

export function getBountyPlaceholderById(id: string): BountyPlaceholderDetail | undefined {
  return BOUNTY_PLACEHOLDERS.find((q) => q.id === id);
}

export function bountyPlaceholderIds(): string[] {
  return BOUNTY_PLACEHOLDERS.map((q) => q.id);
}
