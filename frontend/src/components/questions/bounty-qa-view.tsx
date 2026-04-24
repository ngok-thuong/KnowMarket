"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { BountyStatus } from "@/lib/bounty-placeholder";
import { listBountyPlaceholders } from "@/lib/bounty-placeholder";
import { BountyPageBackground } from "@/components/questions/bounty-bg";

const PLACEHOLDER = listBountyPlaceholders();

const flowSteps = ["Lock bounty", "Free answers", "1 wallet = 1 vote", "Resolve after deadline"] as const;

function RankingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M4 20h4v-6H4v6zm6 0h4V10h-4v10zm6 0h4V6h-4v14z"
        className="fill-current opacity-90"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: BountyStatus }) {
  if (status === "open") {
    return (
      <span className="rounded-full border border-brand/30 bg-brand/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-brand-bright/95">
        Open
      </span>
    );
  }
  return (
    <span className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-paper/50">
      Resolved
    </span>
  );
}

export function BountyQaView({ draft }: { draft: string }) {
  const [filter, setFilter] = useState<"open" | "all" | "resolved">("open");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLACEHOLDER.filter((row) => {
      if (filter === "open" && row.status !== "open") return false;
      if (filter === "resolved" && row.status !== "resolved") return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.excerpt.toLowerCase().includes(q) ||
        row.bountyLabel.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  return (
    <div className="relative min-h-[60vh]">
      {/* Canvas background — cursor spotlight, purple/amber nodes, breathing nebula */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(36rem,68vh)]"
        aria-hidden
      >
        <BountyPageBackground />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <nav className="flex flex-wrap items-center gap-2 font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="text-paper/25">/</span>
          <span className="text-paper/60">Bounty Q&A</span>
          <span className="ml-1 rounded-md border border-brand/35 bg-brand/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand-bright/95">
            USDC escrow
          </span>
        </nav>

        <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="km-pop-in min-w-0 max-w-3xl flex-1 border-l-4 border-brand-bright/55 pl-5 sm:pl-6">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-bright/95">Bounty Q&A</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
              Paid questions, permissionless resolve
            </h1>
            <p className="mt-4 text-base leading-relaxed text-paper/55 sm:text-lg">
              Lock USDC on-chain, collect free answers, vote once per wallet, then anyone can call{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-sm text-brand-bright/90">
                resolve
              </code>{" "}
              after the deadline — winners and refunds follow the contract, not a moderator.
            </p>
          </div>
          <Link
            href="/questions/ranking"
            className="km-pop-in km-cta-shine group inline-flex shrink-0 items-center gap-2.5 self-end rounded-2xl border border-white/12 bg-ink-muted/60 px-4 py-3 shadow-md shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:bg-ink-muted/80 hover:shadow-lg hover:shadow-brand/10 active:translate-y-0 sm:self-start"
            aria-label="View contributor ranking"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-brand/35 bg-gradient-to-br from-brand/20 to-black/30 text-brand-bright transition duration-300 group-hover:border-brand-bright/45 group-hover:from-brand/25 group-hover:to-black/40">
              <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_25%,rgba(196,181,253,0.25),transparent_55%)] opacity-0 transition duration-300 group-hover:opacity-100" />
              <RankingIcon className="relative h-5 w-5 transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
            </span>
            <span className="pr-1 text-left">
              <span className="block text-xs font-medium uppercase tracking-wide text-paper/45">Contributors</span>
              <span className="block text-sm font-semibold text-paper transition duration-300 group-hover:text-brand-bright">
                Ranking
              </span>
            </span>
          </Link>
        </header>

        <div
          className="km-pop-in mt-10 rounded-2xl border border-brand/25 bg-gradient-to-r from-brand/15 via-ink-muted/50 to-transparent p-4 sm:p-5"
          aria-label="Bounty lifecycle"
        >
          <ol className="flex flex-wrap gap-3 sm:gap-4">
            {flowSteps.map((label, i) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-xl border border-brand/20 bg-black/25 px-3 py-2 transition hover:border-brand/35 hover:bg-white/[0.03] sm:px-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand/35 bg-brand/15 font-mono text-xs font-semibold text-brand-bright">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-paper/80">{label}</span>
              </li>
            ))}
          </ol>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          {(
            [
              { k: "Open bounties", v: "12", hint: "Indexer + API (placeholder)" },
              { k: "USDC in escrow", v: "$48.2k", hint: "Across chains (placeholder)" },
              { k: "Avg. time to resolve", v: "18h", hint: "After deadline (placeholder)" },
            ] as const
          ).map((row) => (
            <div
              key={row.k}
              className="km-pop-in rounded-2xl border border-white/[0.08] border-l-4 border-l-brand-bright/55 bg-ink-muted/35 p-5 shadow-inner shadow-black/25"
            >
              <dt className="font-mono text-[10px] uppercase tracking-wider text-paper/40">{row.k}</dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight text-paper">{row.v}</dd>
              <p className="mt-1 text-xs text-paper/45">{row.hint}</p>
            </div>
          ))}
        </dl>

        {draft ? (
          <section
            className="mt-12 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 to-transparent p-5 sm:p-6"
            aria-label="Draft question from home"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-brand-bright">Your draft</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-paper/85 sm:text-base">{draft}</p>
              </div>
              <span className="shrink-0 self-start rounded-lg border border-white/10 bg-black/30 px-2 py-1 font-mono text-[10px] text-paper/45">
                Not on-chain yet
              </span>
            </div>
            <p className="mt-4 text-xs text-paper/45">
              Create flow will open a transaction panel here (approve USDC →{" "}
              <code className="font-mono text-paper/55">createQuestion</code>). For now this is a saved draft from
              the guide bot.
            </p>
            <Link
              href={`/questions/new?q=${encodeURIComponent(draft)}`}
              className="mt-4 inline-flex text-sm font-medium text-brand-bright transition hover:text-paper"
            >
              Open in new bounty composer →
            </Link>
          </section>
        ) : null}

        <div className="km-pop-in mt-12 rounded-2xl border border-brand/20 bg-black/25 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter questions">
              {(
                [
                  { id: "open" as const, label: "Open" },
                  { id: "all" as const, label: "All" },
                  { id: "resolved" as const, label: "Resolved" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-full border px-4 py-2 font-mono text-xs font-medium uppercase tracking-wide transition ${
                    filter === tab.id
                      ? "border-brand/45 bg-brand/20 text-brand-bright"
                      : "border-white/10 bg-white/[0.03] text-paper/50 hover:border-brand/25 hover:text-paper/70"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:max-w-xs">
            <label htmlFor="bounty-search" className="sr-only">
              Search questions
            </label>
            <input
              id="bounty-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or topic…"
              className="w-full rounded-xl border border-white/10 bg-black/35 py-2.5 pl-10 pr-3 text-sm text-paper placeholder:text-paper/35 focus:border-brand/45 focus:outline-none focus:ring-1 focus:ring-brand/35"
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
            Showing <span className="font-mono text-paper/65">{filtered.length}</span> placeholder rows — feed wires to
            the indexer later.
          </p>
          <Link
            href="/questions/new"
            className="km-hover-lift km-cta-shine inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/25 transition hover:bg-brand-dim"
          >
            New bounty
          </Link>
        </div>

        <ul className="mt-8 space-y-4" aria-label="Questions list">
          {filtered.map((row) => (
            <li key={row.id}>
              <Link
                href={`/questions/${row.id}`}
                className="group block rounded-xl border border-y border-r border-white/[0.08] border-l-[3px] border-l-brand-bright/45 bg-ink-muted/35 p-5 outline-none transition duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:bg-ink-muted/50 hover:shadow-lg hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-brand/50 sm:p-6"
              >
                <article>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={row.status} />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-paper/35">
                          {row.chainLabel}
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight text-paper group-hover:text-brand-bright/95 sm:text-xl">
                        {row.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-paper/50">{row.excerpt}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <p className="font-mono text-lg font-semibold text-brand-bright">{row.bountyLabel}</p>
                      <p className="font-mono text-xs text-paper/40">{row.deadlineLabel}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/[0.05] pt-4 font-mono text-xs text-paper/45">
                    <span>
                      <span className="text-paper/30">Answers</span>{" "}
                      <span className="text-paper/70">{row.answers}</span>
                    </span>
                    <span>
                      <span className="text-paper/30">Votes</span>{" "}
                      <span className="text-paper/70">{row.votes}</span>
                    </span>
                    <span className="ml-auto text-paper/35 transition group-hover:text-brand-bright/80">
                      Open thread →
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
            <p className="mt-2 text-xs text-paper/40">Clear the search box or switch to &quot;All&quot;.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
