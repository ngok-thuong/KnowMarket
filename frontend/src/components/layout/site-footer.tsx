import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-ink-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-sm">
          <p className="font-mono text-sm font-semibold text-paper">KnowMarket</p>
          <p className="mt-2 text-sm leading-relaxed text-paper/55">
            MVP targets EVM (e.g. Base / Arbitrum). On-chain escrow and events; indexer → Postgres for
            responsive feeds. AI is UX-only and never triggers payouts.
          </p>
        </div>
        <div className="flex flex-wrap gap-10 text-sm">
          <div>
            <p className="font-medium text-paper/80">Product</p>
            <ul className="mt-3 space-y-2 text-paper/55">
              <li>
                <Link href="/questions" className="transition hover:text-brand-bright">
                  Bounty Q&A
                </Link>
              </li>
              <li>
                <Link href="/posts" className="transition hover:text-brand-bright">
                  Knowledge posts
                </Link>
              </li>
              <li>
                <Link href="/contribute" className="transition hover:text-brand-bright">
                  Contributions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-paper/80">Specs</p>
            <p className="mt-3 max-w-[14rem] text-paper/45">
              Canonical product docs live in the monorepo under{" "}
              <code className="font-mono text-paper/55">docs/</code>.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center font-mono text-xs text-paper/35">
        © {new Date().getFullYear()} KnowMarket — scaffolding
      </div>
    </footer>
  );
}
