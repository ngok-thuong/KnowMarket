"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import { listPostsPlaceholders, type PostPlaceholder } from "@/lib/posts-placeholder";
import { PostsPageBackground } from "@/components/posts/posts-bg";

const PLACEHOLDER = listPostsPlaceholders();

const flowSteps = ["Encrypt client-side", "PostCreated", "purchaseAccess", "Key request", "Decrypt locally"] as const;

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z"
        className="fill-current opacity-90"
      />
    </svg>
  );
}

function PostKindBadge({ kind }: { kind: PostPlaceholder["kind"] }) {
  if (kind === "premium") {
    return (
      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-100/90">
        Premium
      </span>
    );
  }
  return (
    <span className="rounded-full border border-teal-500/25 bg-teal-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-teal-100/85">
      Free
    </span>
  );
}

export function PostsFeedView() {
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLACEHOLDER.filter((row) => {
      if (filter === "free" && row.kind !== "free") return false;
      if (filter === "premium" && row.kind !== "premium") return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.excerpt.toLowerCase().includes(q) ||
        row.tags.some((t) => t.toLowerCase().includes(q)) ||
        row.creator.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  const premiumCount = PLACEHOLDER.filter((p) => p.kind === "premium").length;

  return (
    <div className="relative min-h-[60vh]">
      {/* Canvas background — amber / teal / purple three-colour network */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(36rem,68vh)]"
        aria-hidden
      >
        <PostsPageBackground />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <div className="rounded-[1.75rem] border border-amber-400/25 bg-gradient-to-br from-amber-950/50 via-ink-muted/95 to-teal-950/35 p-6 shadow-2xl shadow-amber-950/20 sm:p-8 lg:p-10">
          <nav className="flex flex-wrap items-center gap-2 font-mono text-xs text-paper/45">
            <Link href="/" className="text-amber-200/90 transition hover:text-paper">
              Home
            </Link>
            <span className="text-paper/25">/</span>
            <span className="text-paper/60">Posts</span>
            <span className="ml-1 rounded-md border border-teal-500/25 bg-teal-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-teal-100/85">
              Feed
            </span>
          </nav>

          <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="min-w-0 max-w-3xl flex-1">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-amber-200/90">Knowledge posts</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
                Free previews, premium ciphertext on IPFS
              </h1>
              <p className="mt-4 text-base leading-relaxed text-paper/55 sm:text-lg">
                Creators publish a preview CID for discovery. Premium bodies stay{" "}
                <strong className="text-amber-100/75">encrypted before upload</strong> (XChaCha20-Poly1305 envelope). After{" "}
                <code className="rounded bg-black/35 px-1.5 py-0.5 font-mono text-sm text-amber-100/90 ring-1 ring-amber-400/25">
                  AccessPurchased
                </code>{" "}
                is confirmed in Postgres, the key service returns the per-post key — the browser decrypts locally; plaintext
                never hits IPFS.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 self-stretch lg:max-w-[14rem]">
              <div className="rounded-2xl border border-amber-400/30 bg-black/30 p-4 shadow-inner shadow-black/30">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-400/15 text-amber-100">
                    <LockIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-amber-200/50">Paywall</p>
                    <p className="text-sm font-semibold text-paper/90">On-chain access</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-paper/50">
                  MVP uses one content key per post across revisions. AAD binds <span className="font-mono text-paper/60">postId:revision</span>.
                </p>
              </div>
            </div>
          </header>
        </div>

        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">Reader journey</p>
          <div
            className="mt-3 flex flex-col gap-2 rounded-2xl border border-amber-400/15 bg-black/25 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1 sm:px-5"
            aria-label="Premium content lifecycle"
          >
            {flowSteps.map((label, i) => (
              <Fragment key={label}>
                <span className="flex items-center gap-2 rounded-lg border border-amber-500/15 bg-amber-950/40 px-3 py-2 font-mono text-[11px] font-medium leading-snug text-paper/80 sm:text-xs">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-amber-400/35 bg-amber-500/15 text-[10px] font-semibold text-amber-100">
                    {i + 1}
                  </span>
                  {label}
                </span>
                {i < flowSteps.length - 1 ? (
                  <span className="hidden px-1 font-mono text-amber-500/45 sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-b from-amber-950/30 to-ink-muted/50 shadow-inner shadow-black/25 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-amber-500/10">
          {(
            [
              { k: "Posts in feed", v: String(PLACEHOLDER.length), hint: "Placeholder rows" },
              { k: "Premium listings", v: String(premiumCount), hint: "Price + cipher CID (mock)" },
              { k: "Indexer latency", v: "< 2s", hint: "Target after confirm depth (mock)" },
            ] as const
          ).map((row) => (
            <div key={row.k} className="border-b border-amber-500/10 p-5 last:border-b-0 sm:border-b-0 sm:p-6">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-amber-200/45">{row.k}</dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight text-paper">{row.v}</dd>
              <p className="mt-1 text-xs text-paper/45">{row.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-amber-500/15 bg-amber-950/15 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter posts">
              {(
                [
                  { id: "all" as const, label: "All" },
                  { id: "free" as const, label: "Free" },
                  { id: "premium" as const, label: "Premium" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-lg border px-4 py-2 font-mono text-xs font-medium uppercase tracking-wide transition ${
                    filter === tab.id
                      ? "border-amber-400/50 bg-amber-500/25 text-amber-50"
                      : "border-white/10 bg-black/20 text-paper/50 hover:border-amber-400/25 hover:text-paper/75"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:max-w-xs">
            <label htmlFor="posts-search" className="sr-only">
              Search posts
            </label>
            <input
              id="posts-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, tags, wallet…"
              className="w-full rounded-xl border border-amber-500/20 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-paper placeholder:text-paper/35 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/35"
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
            Showing <span className="font-mono text-paper/65">{filtered.length}</span> rows — API + indexer wiring
            later.
          </p>
          <Link
            href="/posts/new"
            className="km-hover-lift km-cta-shine inline-flex items-center justify-center rounded-xl border border-amber-400/35 bg-gradient-to-r from-amber-500/90 to-orange-600/90 px-5 py-2.5 text-sm font-semibold text-ink shadow-lg shadow-amber-900/30 transition hover:from-amber-400 hover:to-orange-500"
          >
            New post
          </Link>
        </div>

        <ul className="mt-8 space-y-4" aria-label="Posts list">
          {filtered.map((row) => (
            <li key={row.id}>
              <Link
                href={`/posts/${row.id}`}
                className={`km-hover-lift group block rounded-2xl border p-5 outline-none transition focus-visible:ring-2 focus-visible:ring-amber-400/45 sm:p-6 ${
                  row.kind === "premium"
                    ? "border-amber-400/20 bg-gradient-to-br from-amber-400/[0.08] via-ink-muted/40 to-ink-muted/35 hover:border-amber-300/35 hover:from-amber-400/[0.12]"
                    : "border border-y border-r border-white/[0.08] border-l-2 border-l-teal-400/45 bg-teal-950/15 hover:border-teal-400/30 hover:bg-teal-950/25"
                }`}
              >
                <article>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <PostKindBadge kind={row.kind} />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-paper/35">
                          {row.chainLabel}
                        </span>
                        <span className="font-mono text-[10px] text-paper/30">rev {row.revision}</span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight text-paper group-hover:text-brand-bright/95 sm:text-xl">
                        {row.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-paper/50">{row.excerpt}</p>
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
                        {row.tags.map((t) => (
                          <li
                            key={t}
                            className="rounded-md border border-white/[0.06] bg-black/25 px-2 py-0.5 font-mono text-[10px] text-paper/45"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      {row.kind === "premium" && row.priceLabel ? (
                        <>
                          <p className="font-mono text-lg font-semibold text-amber-100/95">
                            {row.priceLabel} {row.token}
                          </p>
                          <p className="font-mono text-xs text-paper/40">{row.accessLabel}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-mono text-lg font-semibold text-teal-200/80">Free</p>
                          <p className="font-mono text-xs text-paper/40">Preview only</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/[0.05] pt-4 font-mono text-xs text-paper/45">
                    <span className="truncate">
                      <span className="text-paper/30">Creator</span>{" "}
                      <span className="text-paper/70">{row.creator}</span>
                    </span>
                    <span>
                      <span className="text-paper/30">Updated</span>{" "}
                      <span className="text-paper/70">{row.updatedLabel}</span>
                    </span>
                    {row.cipherCid ? (
                      <span className="max-w-[12rem] truncate sm:max-w-xs">
                        <span className="text-paper/30">Cipher</span>{" "}
                        <span className="text-paper/55">{row.cipherCid}</span>
                      </span>
                    ) : null}
                    <span className="ml-auto text-paper/35 transition group-hover:text-brand-bright/80">
                      Open post →
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
