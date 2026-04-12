import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contributions",
  description: "Submit contribution receipts on IPFS; owners assign revenue share in basis points.",
};

export default function ContributePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-wider text-brand-bright">Scaffolding</p>
      <h1 className="mt-2 text-3xl font-semibold text-paper">Contributions</h1>
      <p className="mt-4 text-paper/55">
        Contributors attach artifact CIDs; owners accept with <code className="font-mono text-paper/70">shareBps</code>
        . Recipients withdraw earned shares via pull payments on the content contract.
      </p>
      <Link href="/" className="mt-10 inline-block text-sm font-medium text-brand-bright hover:text-paper">
        ← Back home
      </Link>
    </main>
  );
}
