import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bounty Q&A",
  description: "Questions with USDC bounties, voting, and permissionless resolve after the deadline.",
};

export default function QuestionsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-wider text-brand-bright">Scaffolding</p>
      <h1 className="mt-2 text-3xl font-semibold text-paper">Bounty Q&A</h1>
      <p className="mt-4 text-paper/55">
        This route will list open questions from the API (indexer-backed). Contract flow: create
        question with bounty → answers → votes → <code className="font-mono text-paper/70">resolve</code>{" "}
        after deadline.
      </p>
      <Link href="/" className="mt-10 inline-block text-sm font-medium text-brand-bright hover:text-paper">
        ← Back home
      </Link>
    </main>
  );
}
