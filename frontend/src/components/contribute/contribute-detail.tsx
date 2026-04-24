import Link from "next/link";

import type { ContributionPlaceholderDetail, ContributionStatus } from "@/lib/contribute-placeholder";

function StatusBadge({ status }: { status: ContributionStatus }) {
  if (status === "submitted") {
    return (
      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-amber-100/90">
        Submitted
      </span>
    );
  }
  if (status === "accepted") {
    return (
      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-emerald-100/90">
        Accepted
      </span>
    );
  }
  return (
    <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-rose-100/85">
      Rejected
    </span>
  );
}

export function ContributeDetail({ row }: { row: ContributionPlaceholderDetail }) {
  return (
    <div className="relative min-h-[70vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(26rem,52vh)] opacity-[0.28]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_35%_-5%,rgba(124,58,237,0.38),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(52,211,153,0.1),transparent_42%)]" />
      </div>

      <article className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav className="font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <Link href="/contribute" className="text-brand-bright/90 transition hover:text-paper">
            Contribute
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <span className="text-paper/55">Receipt</span>
        </nav>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={row.status} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-paper/35">{row.chainLabel}</span>
            <span className="rounded-md border border-white/[0.08] bg-black/30 px-2 py-0.5 font-mono text-[10px] text-paper/50">
              {row.kind}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">Contribution receipt</h1>
          <p className="mt-2 text-base text-paper/55">Attached to the knowledge post below (mock indexer row).</p>
        </header>

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-ink-muted/40 p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Post</p>
          <Link
            href={`/posts/${row.postId}`}
            className="mt-2 block text-lg font-semibold tracking-tight text-brand-bright transition hover:text-paper"
          >
            {row.postTitle}
          </Link>
          <p className="mt-1 font-mono text-xs text-paper/40">Slug: {row.postId}</p>
        </div>

        <dl className="mt-6 grid gap-3 rounded-2xl border border-white/[0.08] bg-ink-muted/35 p-4 font-mono text-xs sm:grid-cols-2 sm:p-5">
          <div>
            <dt className="text-paper/40">Contributor</dt>
            <dd className="mt-1 text-paper/75">{row.contributor}</dd>
          </div>
          <div>
            <dt className="text-paper/40">Submitted</dt>
            <dd className="mt-1 text-paper/75">{row.submittedLabel}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-paper/40">Artifact CID (IPFS)</dt>
            <dd className="mt-1 break-all text-[11px] text-paper/55">{row.artifactCid}</dd>
          </div>
          <div>
            <dt className="text-paper/40">shareBps</dt>
            <dd className="mt-1 text-paper/75">{row.shareBps != null ? `${row.shareBps} bps` : "— (pending owner)"}</dd>
          </div>
          <div>
            <dt className="text-paper/40">Contribution id</dt>
            <dd className="mt-1 break-all text-[11px] text-paper/55">{row.id}</dd>
          </div>
        </dl>

        <section className="mt-8 rounded-2xl border border-white/[0.07] bg-ink-muted/30 p-5 sm:p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-paper/70 sm:text-base">{row.summary}</p>
          <p className="mt-4 text-xs leading-relaxed text-paper/45">
            On-chain events: <span className="font-mono text-paper/55">ContributionSubmitted</span>, then{" "}
            <span className="font-mono text-paper/55">ContributionAccepted</span> with <span className="font-mono text-paper/55">shareBps</span>. This page is static mock data only.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-paper/40"
            title="Coming soon"
          >
            Download artifact
          </button>
          {row.status === "accepted" ? (
            <button
              type="button"
              disabled
              className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-paper/45"
              title="Coming soon"
            >
              Withdraw (pull)
            </button>
          ) : null}
          <Link
            href="/contribute/new"
            className="rounded-xl border border-brand/35 bg-brand/15 px-4 py-2.5 text-sm font-medium text-brand-bright transition hover:border-brand/50 hover:bg-brand/25"
          >
            New submission
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-paper/35">
          <Link href="/contribute" className="text-brand-bright/80 transition hover:text-paper">
            ← Back to contribute
          </Link>
        </p>
      </article>
    </div>
  );
}
