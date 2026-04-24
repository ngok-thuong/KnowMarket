import type { Metadata } from "next";

import { BountyQaView } from "@/components/questions/bounty-qa-view";

export const metadata: Metadata = {
  title: "Bounty Q&A",
  description: "Questions with USDC bounties, voting, and permissionless resolve after the deadline.",
};

type QuestionsPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const sp = await searchParams;
  const raw = sp.q;
  const draft =
    typeof raw === "string" ? raw : Array.isArray(raw) && raw[0] ? raw[0] : "";

  return (
    <main className="min-h-[70vh]">
      <BountyQaView draft={draft} />
    </main>
  );
}
