export type PostPlaceholder = {
  id: string;
  title: string;
  excerpt: string;
  creator: string;
  kind: "free" | "premium";
  priceLabel: string | null;
  token: string;
  revision: number;
  chainLabel: string;
  tags: readonly string[];
  previewCid: string;
  cipherCid: string | null;
  /** Mock: indexed purchases or “—” for free */
  accessLabel: string;
  updatedLabel: string;
};

export type PostPlaceholderDetail = PostPlaceholder & {
  previewBody: string;
};

const POSTS = [
  {
    id: "solidity-patterns-2026",
    title: "Solidity patterns we actually ship on Base",
    excerpt:
      "Guards, pull-payments, and event shapes that survived two internal audits — free reference for contributors.",
    creator: "0x4a2c…91e3",
    kind: "free" as const,
    priceLabel: null,
    token: "—",
    revision: 3,
    chainLabel: "Base · mock",
    tags: ["Solidity", "Base", "Patterns"],
    previewCid: "bafybei…preview7",
    cipherCid: null,
    accessLabel: "—",
    updatedLabel: "2d ago",
    previewBody:
      "This note collects the guard + pull-payment defaults we use before any contract hits review. It is plaintext on IPFS as a free post; nothing here is legal or security advice.",
  },
  {
    id: "encrypted-mev-notebook",
    title: "Encrypted notebook: MEV routing experiments",
    excerpt:
      "Premium build log — ciphertext envelope on IPFS, per-post key after AccessPurchased confirms in Postgres.",
    creator: "0x91ff…02aa",
    kind: "premium" as const,
    priceLabel: "24",
    token: "USDC",
    revision: 1,
    chainLabel: "Arbitrum · mock",
    tags: ["MEV", "Premium", "Research"],
    previewCid: "bafybei…preview2",
    cipherCid: "bafybei…cipher9",
    accessLabel: "128 buys",
    updatedLabel: "6h ago",
    previewBody:
      "Public preview only: what changed in builder APIs last month, which venues we trust for backruns, and where we still disagree. Unlock for the full ciphertext bundle and revision history.",
  },
  {
    id: "indexer-idempotency-cheatsheet",
    title: "Indexer idempotency cheatsheet (chain_events)",
    excerpt:
      "Unique (chain_id, tx_hash, log_index), confirmation depth, and how we mark reorgs — free ops note.",
    creator: "0xc0de…beef",
    kind: "free" as const,
    priceLabel: null,
    token: "—",
    revision: 2,
    chainLabel: "Base · mock",
    tags: ["Indexer", "Postgres", "Events"],
    previewCid: "bafybei…preview4",
    cipherCid: null,
    accessLabel: "—",
    updatedLabel: "5d ago",
    previewBody:
      "Every event row lands with the same upsert key; failed_events captures poison logs. This doc is the checklist we run before shipping a new decoder.",
  },
  {
    id: "key-service-threat-model",
    title: "Key service threat model (premium draft)",
    excerpt:
      "Walkthrough of nonce + SIWE verification, single-use TTL, and why plaintext keys never touch logs.",
    creator: "0x7e3a…d401",
    kind: "premium" as const,
    priceLabel: "15",
    token: "USDC",
    revision: 1,
    chainLabel: "Base · mock",
    tags: ["Keys", "Security", "Premium"],
    previewCid: "bafybei…preview1",
    cipherCid: "bafybei…cipher3",
    accessLabel: "41 buys",
    updatedLabel: "1d ago",
    previewBody:
      "Preview lists the assets in scope (API, DB, HSM-shaped KMS placeholder) and the trust boundaries. Paid section includes sequence diagrams and failure trees.",
  },
  {
    id: "contributor-split-ui-spec",
    title: "UI spec: contributor splits must sum to 10,000 bps",
    excerpt:
      "Field validation, optimistic indexer state, and pull-withdraw banners — free product note for the marketplace.",
    creator: "0xfeed…cafe",
    kind: "free" as const,
    priceLabel: null,
    token: "—",
    revision: 4,
    chainLabel: "Arbitrum · mock",
    tags: ["UX", "Contributors", "Contracts"],
    previewCid: "bafybei…preview0",
    cipherCid: null,
    accessLabel: "—",
    updatedLabel: "3d ago",
    previewBody:
      "We never let the form submit unless shareBps totals exactly 10,000. Edge cases: removing a contributor mid-edit, platform fee bps locked by policy.",
  },
  {
    id: "xchacha-envelope-v1",
    title: "Premium: XChaCha20-Poly1305 envelope v1",
    excerpt:
      "Reference ciphertext JSON (alg, nonce, ciphertext, aad, schema_version) plus client decrypt checklist.",
    creator: "0xdead…600d",
    kind: "premium" as const,
    priceLabel: "8",
    token: "USDC",
    revision: 2,
    chainLabel: "Base · mock",
    tags: ["Encryption", "IPFS", "Premium"],
    previewCid: "bafybei…preview5",
    cipherCid: "bafybei…cipher1",
    accessLabel: "256 buys",
    updatedLabel: "12h ago",
    previewBody:
      "schema_version stays at 1 for MVP. AAD binds postId:revision as UTF-8 per spec — the paid bundle includes sample Rust/TS snippets and test vectors.",
  },
] as const satisfies readonly PostPlaceholderDetail[];

function toListRow(p: PostPlaceholderDetail): PostPlaceholder {
  const { previewBody, ...rest } = p;
  void previewBody;
  return rest;
}

export function listPostsPlaceholders(): PostPlaceholder[] {
  return POSTS.map(toListRow);
}

export function postPlaceholderIds(): string[] {
  return POSTS.map((p) => p.id);
}

export function getPostPlaceholderById(id: string): PostPlaceholderDetail | undefined {
  return POSTS.find((p) => p.id === id);
}
