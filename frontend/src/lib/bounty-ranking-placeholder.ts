export type RankingRow = {
  rank: number;
  wallet: string;
  /** Composite index — bar charts normalize vs max in list. */
  score: number;
  bountiesWon: number;
  answersUpvoted: number;
  /** Whole USDC for charts. */
  usdcEarned: number;
  usdcEarnedLabel: string;
  /** Answers that became winning / accepted (mock). */
  winRatePct: number;
  /** Mock delta vs prior window — UI only. */
  velocity7d: number;
};

/** Placeholder leaderboard — replace with API (indexer + aggregates). */
export const BOUNTY_RANKING_PLACEHOLDER: readonly RankingRow[] = [
  {
    rank: 1,
    wallet: "0x4e2…c81B",
    score: 982,
    bountiesWon: 7,
    answersUpvoted: 142,
    usdcEarned: 4180,
    usdcEarnedLabel: "4,180",
    winRatePct: 78,
    velocity7d: 45,
  },
  {
    rank: 2,
    wallet: "0x7aa…33F0",
    score: 864,
    bountiesWon: 5,
    answersUpvoted: 118,
    usdcEarned: 3050,
    usdcEarnedLabel: "3,050",
    winRatePct: 71,
    velocity7d: 22,
  },
  {
    rank: 3,
    wallet: "0xf01…cD44",
    score: 801,
    bountiesWon: 6,
    answersUpvoted: 96,
    usdcEarned: 2640,
    usdcEarnedLabel: "2,640",
    winRatePct: 82,
    velocity7d: -8,
  },
  {
    rank: 4,
    wallet: "0xcC3…91e0",
    score: 712,
    bountiesWon: 4,
    answersUpvoted: 88,
    usdcEarned: 1920,
    usdcEarnedLabel: "1,920",
    winRatePct: 64,
    velocity7d: 31,
  },
  {
    rank: 5,
    wallet: "0x0d4…bE19",
    score: 655,
    bountiesWon: 3,
    answersUpvoted: 74,
    usdcEarned: 1410,
    usdcEarnedLabel: "1,410",
    winRatePct: 59,
    velocity7d: -14,
  },
  {
    rank: 6,
    wallet: "0x22c…88A1",
    score: 590,
    bountiesWon: 4,
    answersUpvoted: 61,
    usdcEarned: 1280,
    usdcEarnedLabel: "1,280",
    winRatePct: 66,
    velocity7d: 6,
  },
  {
    rank: 7,
    wallet: "0xbB1…402F",
    score: 534,
    bountiesWon: 2,
    answersUpvoted: 59,
    usdcEarned: 890,
    usdcEarnedLabel: "890",
    winRatePct: 55,
    velocity7d: -3,
  },
  {
    rank: 8,
    wallet: "0x88d…01aa",
    score: 498,
    bountiesWon: 3,
    answersUpvoted: 52,
    usdcEarned: 760,
    usdcEarnedLabel: "760",
    winRatePct: 61,
    velocity7d: 18,
  },
];

export function rankingMaxima(rows: readonly RankingRow[]) {
  const scores = rows.map((r) => r.score);
  const votes = rows.map((r) => r.answersUpvoted);
  const usdc = rows.map((r) => r.usdcEarned);
  return {
    maxScore: Math.max(...scores, 1),
    maxVotes: Math.max(...votes, 1),
    maxUsdc: Math.max(...usdc, 1),
  };
}
