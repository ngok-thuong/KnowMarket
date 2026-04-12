import Link from "next/link";

export function TeaserSection() {
  return (
    <section className="border-t border-white/5 bg-ink-muted/30" aria-labelledby="teaser-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 id="teaser-heading" className="text-xl font-semibold text-paper">
              Live feeds
            </h2>
            <p className="mt-2 max-w-lg text-sm text-paper/50">
              Question lists, post feeds, and contribution queues will load from the API backed by the
              indexer. This block is a placeholder until those endpoints are wired.
            </p>
          </div>
          <Link
            href="/questions"
            className="shrink-0 text-sm font-medium text-brand-bright hover:text-paper"
          >
            Go to questions →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {["Open bounties", "Recent posts", "Pending contributions"].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-dashed border-white/10 bg-ink/50 px-4 py-10 text-center"
            >
              <p className="font-mono text-xs text-paper/35">{label}</p>
              <p className="mt-2 text-sm text-paper/25">API + indexer</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
