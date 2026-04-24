import type { Metadata } from "next";

import { BountyRankingView } from "@/components/questions/bounty-ranking-view";

export const metadata: Metadata = {
  title: "Contributor ranking",
  description: "Placeholder bounty Q&A leaderboard — indexer-backed aggregates later.",
};

export default function BountyRankingPage() {
  return (
    <main className="min-h-[60vh]">
      <BountyRankingView />
    </main>
  );
}
