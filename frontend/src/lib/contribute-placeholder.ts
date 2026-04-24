export type ContributionStatus = "submitted" | "accepted" | "rejected";

export type ContributionPlaceholder = {
  id: string;
  postId: string;
  postTitle: string;
  contributor: string;
  kind: string;
  artifactCid: string;
  status: ContributionStatus;
  /** Set when owner calls acceptContribution; must keep revenue split at 10_000 bps total per post */
  shareBps: number | null;
  chainLabel: string;
  submittedLabel: string;
};

export type ContributionPlaceholderDetail = ContributionPlaceholder & {
  summary: string;
};

const ROWS = [
  {
    id: "contrib-gas-bench-v2",
    postId: "solidity-patterns-2026",
    postTitle: "Solidity patterns we actually ship on Base",
    contributor: "0x88aa…01fc",
    kind: "Benchmarks",
    artifactCid: "bafybei…artifact1",
    status: "submitted" as const,
    shareBps: null,
    chainLabel: "Base · mock",
    submittedLabel: "4h ago",
    summary:
      "Gas snapshots for the guard + pull-payment patterns in the post, plus a Foundry repro repo CID in the artifact bundle.",
  },
  {
    id: "contrib-mev-diagrams",
    postId: "encrypted-mev-notebook",
    postTitle: "Encrypted notebook: MEV routing experiments",
    contributor: "0x71ce…ab12",
    kind: "Diagrams",
    artifactCid: "bafybei…artifact4",
    status: "accepted" as const,
    shareBps: 1200,
    chainLabel: "Arbitrum · mock",
    submittedLabel: "2d ago",
    summary:
      "Sequence diagrams for builder submission paths; owner accepted at 1,200 bps toward the 10,000 bps cap for this post.",
  },
  {
    id: "contrib-indexer-runbook",
    postId: "indexer-idempotency-cheatsheet",
    postTitle: "Indexer idempotency cheatsheet (chain_events)",
    contributor: "0xc0de…beef",
    kind: "Runbook",
    artifactCid: "bafybei…artifact2",
    status: "submitted" as const,
    shareBps: null,
    chainLabel: "Base · mock",
    submittedLabel: "1d ago",
    summary:
      "Operational runbook: replay from failed_events, safe checkpointing, and how we tag reverted rows after reorg.",
  },
  {
    id: "contrib-threat-peer-review",
    postId: "key-service-threat-model",
    postTitle: "Key service threat model (premium draft)",
    contributor: "0x9f01…44cd",
    kind: "Review",
    artifactCid: "bafybei…artifact7",
    status: "rejected" as const,
    shareBps: null,
    chainLabel: "Base · mock",
    submittedLabel: "6d ago",
    summary:
      "Peer review notes; rejected in this mock row — owner cited overlap with an in-flight internal doc (no on-chain state here).",
  },
  {
    id: "contrib-split-calculator",
    postId: "contributor-split-ui-spec",
    postTitle: "UI spec: contributor splits must sum to 10,000 bps",
    contributor: "0xfeed…cafe",
    kind: "Tooling",
    artifactCid: "bafybei…artifact3",
    status: "accepted" as const,
    shareBps: 800,
    chainLabel: "Arbitrum · mock",
    submittedLabel: "3d ago",
    summary:
      "Small spreadsheet + JSON schema for shareBps validation in the composer; accepted at 800 bps.",
  },
  {
    id: "contrib-envelope-snippets",
    postId: "xchacha-envelope-v1",
    postTitle: "Premium: XChaCha20-Poly1305 envelope v1",
    contributor: "0xdead…600d",
    kind: "Code",
    artifactCid: "bafybei…artifact8",
    status: "submitted" as const,
    shareBps: null,
    chainLabel: "Base · mock",
    submittedLabel: "8h ago",
    summary:
      "Rust + TypeScript snippets for envelope packing and AAD binding to postId:revision; awaiting owner review.",
  },
  {
    id: "contrib-withdraw-banner-copy",
    postId: "solidity-patterns-2026",
    postTitle: "Solidity patterns we actually ship on Base",
    contributor: "0x4a2c…91e3",
    kind: "Copy",
    artifactCid: "bafybei…artifact0",
    status: "accepted" as const,
    shareBps: 500,
    chainLabel: "Base · mock",
    submittedLabel: "1w ago",
    summary:
      "UI strings for pull-withdraw banners when indexer shows a non-zero owed balance; accepted at 500 bps.",
  },
] as const satisfies readonly ContributionPlaceholderDetail[];

function toListRow(row: ContributionPlaceholderDetail): ContributionPlaceholder {
  const { summary, ...rest } = row;
  void summary;
  return rest;
}

export function listContributionPlaceholders(): ContributionPlaceholder[] {
  return ROWS.map(toListRow);
}

export function contributionPlaceholderIds(): string[] {
  return ROWS.map((r) => r.id);
}

export function getContributionPlaceholderById(id: string): ContributionPlaceholderDetail | undefined {
  return ROWS.find((r) => r.id === id);
}
