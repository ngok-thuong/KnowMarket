import Link from "next/link";

const steps = [
  "Package proof (diffs, diagrams, benchmarks) and upload to IPFS — store the CID.",
  "Call submitContribution(postId, kind, artifactCid) from the contributor wallet.",
  "Wait for ContributionSubmitted in the indexer; owner reviews off-chain or in-app.",
  "Owner accepts with acceptContribution(postId, contribId, shareBps); verify Σ bps stays 10,000.",
  "After revenue accrues, recipients call withdraw(postId) — pull payments only.",
] as const;

export function ContributeNewView() {
  return (
    <div className="relative min-h-[70vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(24rem,50vh)] opacity-[0.28]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-5%,rgba(52,211,153,0.1),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(124,58,237,0.38),transparent_48%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav className="font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <Link href="/contribute" className="text-brand-bright/90 transition hover:text-paper">
            Contribute
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <span className="text-paper/60">New</span>
        </nav>

        <header className="mt-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-bright/95">Submit receipt</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-paper sm:text-4xl">New contribution</h1>
          <p className="mt-4 text-base leading-relaxed text-paper/55">
            Scaffold for attaching an IPFS artifact to a post and emitting <span className="font-mono text-paper/65">ContributionSubmitted</span>. Share assignment and withdrawals stay on the content contract — the UI here does not move funds.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-white/[0.08] bg-ink-muted/40 p-5 sm:p-6" aria-label="Flow">
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Checklist</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-paper/65">
            {steps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <div className="mt-10 space-y-4 rounded-2xl border border-dashed border-white/12 bg-black/20 p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Form (disabled)</p>
          <label className="block">
            <span className="text-xs text-paper/45">Target post id</span>
            <input
              disabled
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-paper/35"
              placeholder="e.g. solidity-patterns-2026"
            />
          </label>
          <label className="block">
            <span className="text-xs text-paper/45">Kind (label for UI)</span>
            <input
              disabled
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-paper/35"
              placeholder="Benchmarks, diagrams, runbook…"
            />
          </label>
          <label className="block">
            <span className="text-xs text-paper/45">Artifact CID</span>
            <input
              disabled
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-paper/35"
              placeholder="bafybei… (after IPFS upload)"
            />
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled
              className="rounded-xl bg-brand/40 px-5 py-2.5 text-sm font-semibold text-paper/50"
            >
              Submit on-chain (soon)
            </button>
            <Link
              href="/contribute"
              className="inline-flex items-center rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-paper/70 transition hover:border-white/25 hover:text-paper"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
