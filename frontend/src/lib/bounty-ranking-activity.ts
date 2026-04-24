/**
 * Mock per-user activity for ranking drawer — heatmap + claimed pulls.
 * Replace with indexer + subgraph reads later.
 */

export type ClaimEvent = {
  id: string;
  date: string;
  title: string;
  usdc: number;
  txShort: string;
  kind: "bounty_win" | "withdraw_pull";
};

export type UserActivityProfile = {
  rank: number;
  /** 14 weeks × 7 days, column-major: each inner array is one week Mon→Sun, intensity 0–4 */
  heatmapWeeks: readonly (readonly number[])[];
  claims: readonly ClaimEvent[];
  /** Mock “resolve streak” for flair */
  streakDays: number;
};

const W = 14;
const D = 7;

/** Pseudo-random but stable pattern per rank — intensities 0–4 */
function makeHeatmap(rank: number): readonly (readonly number[])[] {
  const weeks: number[][] = [];
  for (let c = 0; c < W; c++) {
    const col: number[] = [];
    for (let r = 0; r < D; r++) {
      const n = (rank * 19 + c * 5 + r * 11 + c * r * 3) % 23;
      let v = n % 5;
      if (rank <= 2) v = Math.min(4, v + 1);
      col.push(v);
    }
    weeks.push(col);
  }
  return weeks;
}

const PROFILES: Record<number, UserActivityProfile> = {
  1: {
    rank: 1,
    heatmapWeeks: makeHeatmap(1),
    streakDays: 18,
    claims: [
      {
        id: "c1",
        date: "2026-04-08",
        title: "Indexer idempotency bounty — winning answer",
        usdc: 250,
        txShort: "0x9a2…71ce",
        kind: "bounty_win",
      },
      {
        id: "c2",
        date: "2026-04-05",
        title: "Pull-payment gas Q — winning answer",
        usdc: 500,
        txShort: "0x3d1…aa02",
        kind: "bounty_win",
      },
      {
        id: "c3",
        date: "2026-03-28",
        title: "withdraw() on QnA — claimed share",
        usdc: 120,
        txShort: "0xe44…09bb",
        kind: "withdraw_pull",
      },
      {
        id: "c4",
        date: "2026-03-14",
        title: "SIWE nonce architecture — 2nd place pool",
        usdc: 40,
        txShort: "0x01b…88fa",
        kind: "bounty_win",
      },
    ],
  },
  2: {
    rank: 2,
    heatmapWeeks: makeHeatmap(2),
    streakDays: 11,
    claims: [
      {
        id: "c1",
        date: "2026-04-06",
        title: "Revenue split bounty — winning answer",
        usdc: 500,
        txShort: "0x2c0…4eed",
        kind: "bounty_win",
      },
      {
        id: "c2",
        date: "2026-03-22",
        title: "Premium AAD question — winning answer",
        usdc: 120,
        txShort: "0x77f…c901",
        kind: "bounty_win",
      },
      {
        id: "c3",
        date: "2026-03-09",
        title: "QnA escrow withdraw",
        usdc: 85,
        txShort: "0xb91…3320",
        kind: "withdraw_pull",
      },
    ],
  },
  3: {
    rank: 3,
    heatmapWeeks: makeHeatmap(3),
    streakDays: 9,
    claims: [
      {
        id: "c1",
        date: "2026-04-01",
        title: "SIWE nonce — winning answer",
        usdc: 80,
        txShort: "0x4aa…10de",
        kind: "bounty_win",
      },
      {
        id: "c2",
        date: "2026-03-19",
        title: "Indexer replay — honourable mention split",
        usdc: 55,
        txShort: "0x09c…77ab",
        kind: "bounty_win",
      },
    ],
  },
  4: {
    rank: 4,
    heatmapWeeks: makeHeatmap(4),
    streakDays: 6,
    claims: [
      {
        id: "c1",
        date: "2026-03-30",
        title: "XChaCha AAD — winning answer",
        usdc: 120,
        txShort: "0x55e…cc11",
        kind: "bounty_win",
      },
      {
        id: "c2",
        date: "2026-03-12",
        title: "Contribution share withdraw",
        usdc: 210,
        txShort: "0x8dd…90fe",
        kind: "withdraw_pull",
      },
    ],
  },
  5: {
    rank: 5,
    heatmapWeeks: makeHeatmap(5),
    streakDays: 4,
    claims: [
      {
        id: "c1",
        date: "2026-03-25",
        title: "Gas tradeoff Q — 3rd place",
        usdc: 90,
        txShort: "0x31a…2201",
        kind: "bounty_win",
      },
    ],
  },
  6: {
    rank: 6,
    heatmapWeeks: makeHeatmap(6),
    streakDays: 5,
    claims: [
      {
        id: "c1",
        date: "2026-03-27",
        title: "Bounty resolve bonus (mock)",
        usdc: 180,
        txShort: "0x66b…01aa",
        kind: "bounty_win",
      },
      {
        id: "c2",
        date: "2026-03-03",
        title: "withdraw pull",
        usdc: 95,
        txShort: "0x0f0…bbaa",
        kind: "withdraw_pull",
      },
    ],
  },
  7: {
    rank: 7,
    heatmapWeeks: makeHeatmap(7),
    streakDays: 2,
    claims: [
      {
        id: "c1",
        date: "2026-03-18",
        title: "Open bounty — partial pool",
        usdc: 60,
        txShort: "0xacc…4412",
        kind: "bounty_win",
      },
    ],
  },
  8: {
    rank: 8,
    heatmapWeeks: makeHeatmap(8),
    streakDays: 3,
    claims: [
      {
        id: "c1",
        date: "2026-04-02",
        title: "Small bounty win",
        usdc: 45,
        txShort: "0xd01…90ab",
        kind: "bounty_win",
      },
      {
        id: "c2",
        date: "2026-02-20",
        title: "withdraw pull",
        usdc: 30,
        txShort: "0x12e…ff00",
        kind: "withdraw_pull",
      },
    ],
  },
};

export function getRankingUserActivity(rank: number): UserActivityProfile | undefined {
  return PROFILES[rank];
}
