import Link from "next/link";

import type { BountyPlaceholderDetail } from "@/lib/bounty-placeholder";

function StatusBadge({ status }: { status: BountyPlaceholderDetail["status"] }) {
  if (status === "open") {
    return (
      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-emerald-200/90">
        Open
      </span>
    );
  }
  return (
    <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-paper/50">
      Resolved
    </span>
  );
}

export function BountyQuestionDetail({ question: q }: { question: BountyPlaceholderDetail }) {
  return (
    <div className="relative min-h-[70vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(24rem,50vh)] opacity-[0.3]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_30%_-5%,rgba(124,58,237,0.4),transparent_55%)]" />
      </div>

      <article className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav className="font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <Link href="/questions" className="text-brand-bright/90 transition hover:text-paper">
            Bounty Q&A
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <span className="text-paper/55">Question</span>
        </nav>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={q.status} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-paper/35">{q.chainLabel}</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">{q.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-paper/55">{q.excerpt}</p>
        </header>

        <dl className="mt-8 grid gap-3 rounded-2xl border border-white/[0.08] bg-ink-muted/40 p-4 font-mono text-xs sm:grid-cols-2 sm:p-5">
          <div>
            <dt className="text-paper/40">Bounty</dt>
            <dd className="mt-1 text-lg font-semibold text-brand-bright">{q.bountyLabel}</dd>
          </div>
          <div>
            <dt className="text-paper/40">Deadline</dt>
            <dd className="mt-1 text-paper/75">{q.deadlineLabel}</dd>
          </div>
          <div>
            <dt className="text-paper/40">Asker</dt>
            <dd className="mt-1 text-paper/70">{q.asker}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-paper/40">Question CID (IPFS)</dt>
            <dd className="mt-1 break-all text-[11px] text-paper/55">{q.questionCid}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-paper/40"
            title="Coming soon"
          >
            Submit answer
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-paper/40"
            title="Coming soon"
          >
            Cast vote
          </button>
        </div>

        <section className="mt-12" aria-labelledby="question-body">
          <h2 id="question-body" className="sr-only">
            Full question
          </h2>
          <div className="rounded-2xl border border-white/[0.07] bg-ink-muted/30 p-5 sm:p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper/75 sm:text-base">{q.body}</p>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="answers-heading">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-4">
            <h2 id="answers-heading" className="text-lg font-semibold text-paper">
              Answers
            </h2>
            <p className="font-mono text-xs text-paper/40">
              {q.answersList.length} shown · {q.votes} total votes (mock)
            </p>
          </div>
          <ol className="mt-6 space-y-5">
            {q.answersList.map((a, index) => (
              <li key={a.id}>
                <div className="rounded-2xl border border-white/[0.07] bg-ink-muted/25 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-brand-bright/80">
                        Answer #{index + 1}
                      </p>
                      <p className="mt-1 font-mono text-xs text-paper/55">{a.author}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-paper/35">{a.submittedAgo}</span>
                      <span className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs text-paper/60">
                        {a.votes} votes
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-paper/70">{a.excerpt}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-paper/55">{a.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-12 text-center text-xs text-paper/35">
          Placeholder thread — contract + indexer wiring replaces this data later.
        </p>
      </article>
    </div>
  );
}
