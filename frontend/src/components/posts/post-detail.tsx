import Link from "next/link";

import type { PostPlaceholderDetail } from "@/lib/posts-placeholder";

function PostKindBadge({ kind }: { kind: PostPlaceholderDetail["kind"] }) {
  if (kind === "premium") {
    return (
      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-amber-100/90">
        Premium
      </span>
    );
  }
  return (
    <span className="rounded-full border border-teal-500/25 bg-teal-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-teal-100/85">
      Free
    </span>
  );
}

export function PostDetail({ post: p }: { post: PostPlaceholderDetail }) {
  return (
    <div className="relative min-h-[70vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(26rem,52vh)] opacity-[0.3]"
        aria-hidden
      >
        <div
          className={`absolute inset-0 ${
            p.kind === "premium"
              ? "bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(251,191,36,0.18),transparent_55%)]"
              : "bg-[radial-gradient(ellipse_80%_55%_at_30%_-5%,rgba(124,58,237,0.4),transparent_55%)]"
          }`}
        />
      </div>

      <article className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav className="font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <Link href="/posts" className="text-brand-bright/90 transition hover:text-paper">
            Posts
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <span className="text-paper/55">Post</span>
        </nav>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <PostKindBadge kind={p.kind} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-paper/35">{p.chainLabel}</span>
            <span className="font-mono text-[10px] text-paper/30">revision {p.revision}</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">{p.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-paper/55">{p.excerpt}</p>
        </header>

        <dl className="mt-8 grid gap-3 rounded-2xl border border-white/[0.08] bg-ink-muted/40 p-4 font-mono text-xs sm:grid-cols-2 sm:p-5">
          <div>
            <dt className="text-paper/40">Creator</dt>
            <dd className="mt-1 text-paper/75">{p.creator}</dd>
          </div>
          <div>
            <dt className="text-paper/40">Updated</dt>
            <dd className="mt-1 text-paper/75">{p.updatedLabel}</dd>
          </div>
          {p.kind === "premium" && p.priceLabel ? (
            <div>
              <dt className="text-paper/40">Price</dt>
              <dd className="mt-1 text-lg font-semibold text-amber-100/95">
                {p.priceLabel} {p.token}
              </dd>
            </div>
          ) : null}
          {p.kind === "premium" ? (
            <div>
              <dt className="text-paper/40">Access (mock)</dt>
              <dd className="mt-1 text-paper/75">{p.accessLabel}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-paper/40">Preview CID (IPFS)</dt>
            <dd className="mt-1 break-all text-[11px] text-paper/55">{p.previewCid}</dd>
          </div>
          {p.cipherCid ? (
            <div className="sm:col-span-2">
              <dt className="text-paper/40">Ciphertext envelope CID</dt>
              <dd className="mt-1 break-all text-[11px] text-paper/55">{p.cipherCid}</dd>
            </div>
          ) : null}
        </dl>

        <section className="mt-8 rounded-2xl border border-white/[0.07] bg-ink-muted/30 p-5 sm:p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Preview body</h2>
          <p className="mt-3 text-sm leading-relaxed text-paper/70 sm:text-base">{p.previewBody}</p>
          {p.kind === "premium" ? (
            <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
              <p className="text-xs leading-relaxed text-paper/55">
                Full content decrypts in the browser after a confirmed <span className="font-mono text-paper/65">AccessPurchased</span> row and a valid{" "}
                <span className="font-mono text-paper/65">POST /keys/request</span> (nonce + signature). This page is static mock data only.
              </p>
            </div>
          ) : null}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          {p.kind === "premium" ? (
            <button
              type="button"
              disabled
              className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-sm font-medium text-paper/45"
              title="Coming soon"
            >
              Purchase access
            </button>
          ) : null}
          <button
            type="button"
            disabled
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-paper/40"
            title="Coming soon"
          >
            Share link
          </button>
          <Link
            href="/posts/new"
            className="rounded-xl border border-brand/35 bg-brand/15 px-4 py-2.5 text-sm font-medium text-brand-bright transition hover:border-brand/50 hover:bg-brand/25"
          >
            Open composer (scaffold)
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-paper/35">
          <Link href="/posts" className="text-brand-bright/80 transition hover:text-paper">
            ← Back to posts
          </Link>
        </p>
      </article>
    </div>
  );
}
