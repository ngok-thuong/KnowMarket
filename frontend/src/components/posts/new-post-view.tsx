import Link from "next/link";

const checklist = [
  "Draft title + preview markdown (plaintext preview CID).",
  "Generate contentKey; encrypt body with XChaCha20-Poly1305; upload envelope JSON to IPFS.",
  "POST /keys/store (authed) so the API holds the key encrypted at rest.",
  "createPost(isPremium, price, token, cipherCid, previewCid) — wait for indexer + confirmations.",
] as const;

export function NewPostView() {
  return (
    <div className="relative min-h-[70vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(24rem,50vh)] opacity-[0.28]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-5%,rgba(124,58,237,0.42),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_35%,rgba(251,191,36,0.1),transparent_42%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav className="font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <Link href="/posts" className="text-brand-bright/90 transition hover:text-paper">
            Posts
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <span className="text-paper/60">New</span>
        </nav>

        <header className="mt-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-bright/95">Composer</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-paper sm:text-4xl">New knowledge post</h1>
          <p className="mt-4 text-base leading-relaxed text-paper/55">
            Scaffold for the premium pipeline: client-side encryption first, then chain + indexer. Free posts still use a preview CID; premium adds a ciphertext CID and on-chain price.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-white/[0.08] bg-ink-muted/40 p-5 sm:p-6" aria-label="Checklist">
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Intended flow</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-paper/65">
            {checklist.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <div className="mt-10 space-y-4 rounded-2xl border border-dashed border-white/12 bg-black/20 p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Draft fields (disabled)</p>
          <label className="block">
            <span className="text-xs text-paper/45">Title</span>
            <input
              disabled
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-paper/35"
              placeholder="Ships with wallet + API session"
            />
          </label>
          <label className="block">
            <span className="text-xs text-paper/45">Body markdown</span>
            <textarea
              disabled
              rows={5}
              className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-paper/35"
              placeholder="Encrypt before IPFS upload — never paste premium plaintext into a public gateway."
            />
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled
              className="rounded-xl bg-brand/40 px-5 py-2.5 text-sm font-semibold text-paper/50"
            >
              Publish (soon)
            </button>
            <Link
              href="/posts"
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
