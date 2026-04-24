"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { listContributionPlaceholders, type ContributionStatus } from "@/lib/contribute-placeholder";

const PLACEHOLDER = listContributionPlaceholders();

const flowSteps = [
  "Proof artifact → IPFS",
  "submitContribution",
  "ContributionSubmitted",
  "acceptContribution(shareBps)",
  "Recipients = 10_000 bps",
  "withdraw() pull pay",
] as const;

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function StatusBadge({ status }: { status: ContributionStatus }) {
  if (status === "submitted") {
    return (
      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-100/90">
        Submitted
      </span>
    );
  }
  if (status === "accepted") {
    return (
      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald-100/90">
        Accepted
      </span>
    );
  }
  return (
    <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-rose-100/85">
      Rejected
    </span>
  );
}

type FilterId = "all" | ContributionStatus;

export function ContributeView() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLACEHOLDER.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!q) return true;
      return (
        row.postTitle.toLowerCase().includes(q) ||
        row.contributor.toLowerCase().includes(q) ||
        row.kind.toLowerCase().includes(q) ||
        row.artifactCid.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  const submitted = PLACEHOLDER.filter((r) => r.status === "submitted").length;
  const accepted = PLACEHOLDER.filter((r) => r.status === "accepted").length;

  return (
    <div className="relative min-h-[60vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(32rem,58vh)] opacity-[0.34]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_45%_-8%,rgba(52,211,153,0.12),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(124,58,237,0.38),transparent_48%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <nav className="flex flex-wrap items-center gap-2 font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="text-paper/25">/</span>
          <span className="text-paper/60">Contribute</span>
          <span className="ml-1 rounded border border-brand/35 bg-brand/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand-bright/95">
            Splits
          </span>
        </nav>

        <header className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="min-w-0 max-w-3xl flex-1 rounded-xl border border-brand/25 bg-ink-muted/60 p-6 shadow-lg shadow-black/30 sm:p-7">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-bright/95">Contribution marketplace</p>
            <h1 className="mt-3 text-3xl font-semibold leading-snug tracking-tight text-paper sm:text-4xl">
              Proof-of-work receipts, on-chain revenue splits
            </h1>
            <p className="mt-4 text-base leading-relaxed text-paper/55 sm:text-lg">
              Contributors upload an artifact bundle to IPFS and call{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-brand-bright/90 ring-1 ring-brand/30 sm:text-sm">
                submitContribution
              </code>
              . Post owners accept with{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-brand-bright/90 ring-1 ring-brand/30 sm:text-sm">
                shareBps
              </code>{" "}
              (0–10,000). Indexed recipients must sum to exactly <strong className="text-brand-bright/90">10,000 bps</strong> per post; earnings
              settle through <strong className="text-paper/70">pull-payment</strong> <code className="font-mono text-paper/60">withdraw</code>{" "}
              — no push loops in the contract.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 self-stretch lg:max-w-[14rem]">
            <div className="rounded-2xl border border-white/12 border-l-4 border-l-brand-bright/50 bg-ink-muted/55 p-4 shadow-md shadow-black/25">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/35 bg-brand/15 text-brand-bright">
                  <ReceiptIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Invariant</p>
                  <p className="font-mono text-sm font-semibold text-paper/90">Σ shareBps = 10k</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-paper/45">
                Indexer recalculates <span className="font-mono text-brand-bright/80">revenue_recipients</span> after each{" "}
                <span className="font-mono text-brand-bright/80">ContributionAccepted</span> event.
              </p>
            </div>
          </div>
        </header>

        <ol
          className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
          aria-label="Contribution lifecycle"
        >
          {flowSteps.map((label, i) => (
            <li
              key={label}
              className="flex min-h-[5.75rem] flex-col justify-between rounded-lg border border-brand/20 bg-ink-muted/50 p-3 font-mono text-[10px] leading-snug text-paper/75 sm:min-h-0 sm:text-[11px]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded border border-brand/40 bg-brand/20 text-[10px] font-semibold text-brand-bright">
                {i + 1}
              </span>
              <span className="mt-2 text-paper/80">{label}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col divide-y divide-white/10 overflow-hidden rounded-xl border border-white/[0.08] bg-ink-muted/40 font-mono sm:flex-row sm:divide-x sm:divide-y-0">
          {(
            [
              { k: "Open submissions", v: String(submitted), hint: "Awaiting owner (mock)" },
              { k: "Accepted (mock)", v: String(accepted), hint: "shareBps recorded" },
              { k: "Platform fee bps", v: "TBD", hint: "Policy + contract constant" },
            ] as const
          ).map((row) => (
            <div key={row.k} className="flex flex-1 flex-col px-5 py-4 sm:px-6 sm:py-5">
              <span className="text-[10px] uppercase tracking-wider text-brand-bright/50">{row.k}</span>
              <span className="mt-2 text-2xl font-semibold tracking-tight text-paper">{row.v}</span>
              <span className="mt-1 text-xs text-paper/40">{row.hint}</span>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-brand/20 bg-ink-muted/35 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1" role="tablist" aria-label="Filter contributions">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-paper/35">Status</p>
              <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
                {(
                  [
                    { id: "all" as const, label: "All" },
                    { id: "submitted" as const, label: "Submitted" },
                    { id: "accepted" as const, label: "Accepted" },
                    { id: "rejected" as const, label: "Rejected" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`relative px-3 py-2 font-mono text-xs font-medium uppercase tracking-wide transition ${
                      filter === tab.id
                        ? "text-brand-bright after:pointer-events-none after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand-bright"
                        : "text-paper/45 hover:text-paper/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative w-full lg:max-w-xs">
            <label htmlFor="contribute-search" className="sr-only">
              Search contributions
            </label>
            <input
              id="contribute-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search post, wallet, kind…"
              className="w-full rounded-lg border border-white/10 bg-black/35 py-2.5 pl-10 pr-3 text-sm text-paper placeholder:text-paper/35 focus:border-brand/45 focus:outline-none focus:ring-1 focus:ring-brand/35"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paper/35" aria-hidden>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-paper/45">
            Showing <span className="font-mono text-paper/65">{filtered.length}</span> placeholder rows — indexer + API
            later.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/posts"
              className="inline-flex items-center justify-center rounded-xl border border-white/12 px-5 py-2.5 text-sm font-medium text-paper/75 transition hover:border-white/20 hover:text-paper"
            >
              Browse posts
            </Link>
            <Link
              href="/contribute/new"
              className="km-hover-lift km-cta-shine inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/25 transition hover:bg-brand-dim"
            >
              Submit contribution
            </Link>
          </div>
        </div>

        <ul className="mt-8 space-y-4" aria-label="Contributions list">
          {filtered.map((row) => (
            <li key={row.id}>
              <Link
                href={`/contribute/${row.id}`}
                className="km-hover-lift group block rounded-lg border border-y border-r border-white/[0.08] border-l-2 border-l-brand-bright/45 bg-ink-muted/35 p-5 outline-none transition hover:border-brand/30 hover:bg-ink-muted/50 focus-visible:ring-2 focus-visible:ring-brand/50 sm:p-6"
              >
                <article>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={row.status} />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-paper/35">{row.chainLabel}</span>
                        <span className="rounded-md border border-white/[0.06] bg-black/25 px-2 py-0.5 font-mono text-[10px] text-paper/50">
                          {row.kind}
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight text-paper group-hover:text-brand-bright/95 sm:text-xl">
                        {row.postTitle}
                      </h2>
                      <p className="mt-1 font-mono text-[11px] text-paper/40">
                        Contribution for post <span className="text-paper/55">{row.postId}</span> — open card for receipt
                        detail and post link.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right font-mono">
                      {row.shareBps != null ? (
                        <>
                          <p className="text-lg font-semibold text-brand-bright/95">{row.shareBps} bps</p>
                          <p className="text-xs text-paper/40">assigned share</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-semibold text-paper/45">—</p>
                          <p className="text-xs text-paper/40">pending split</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-4 font-mono text-xs text-paper/45">
                    <span className="truncate">
                      <span className="text-paper/30">Contributor</span>{" "}
                      <span className="text-paper/70">{row.contributor}</span>
                    </span>
                    <span>
                      <span className="text-paper/30">Submitted</span>{" "}
                      <span className="text-paper/70">{row.submittedLabel}</span>
                    </span>
                    <span className="max-w-[14rem] truncate sm:max-w-md">
                      <span className="text-paper/30">Artifact</span>{" "}
                      <span className="text-paper/55">{row.artifactCid}</span>
                    </span>
                    <span className="ml-auto text-paper/35 transition group-hover:text-brand-bright/80">
                      Open receipt →
                    </span>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
            <p className="text-sm font-medium text-paper/60">No matches for this filter or search.</p>
            <p className="mt-2 text-xs text-paper/40">Clear the search or switch to &quot;All&quot;.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
