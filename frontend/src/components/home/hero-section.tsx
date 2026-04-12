import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(124,58,237,0.38),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgb(10,12,16))]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-bright">
          Web3 knowledge marketplace
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-paper sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
          Ask with a bounty. Publish premium knowledge. Split revenue with contributors —{" "}
          <span className="text-brand-bright">rules on-chain</span>, feeds from the indexer.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/60">
          USDC escrow for Q&A, vote-based resolve after the deadline, client-side encryption for premium
          posts, and pull-payment withdrawals for shared revenue.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/questions"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-paper shadow-lg shadow-brand/25 transition hover:bg-brand-dim"
          >
            Browse open questions
          </Link>
          <Link
            href="/posts"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-paper transition hover:border-brand/45 hover:bg-white/[0.06]"
          >
            View posts
          </Link>
        </div>
      </div>
    </section>
  );
}
