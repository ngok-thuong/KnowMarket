import Link from "next/link";

const pillars = [
  {
    title: "Bounty Q&A",
    body: "Lock USDC on a question. Answers are free to submit. One vote per wallet. After the deadline, anyone can resolve — the winning answer receives the escrow automatically.",
    href: "/questions",
    cta: "Open questions",
    tag: "QnA.sol",
  },
  {
    title: "Premium posts",
    body: "Creators encrypt content in the browser, upload ciphertext to IPFS, and list a price. Buyers pay on-chain; after confirmations, the key service releases the decryption key.",
    href: "/posts",
    cta: "Explore posts",
    tag: "Encrypted IPFS",
  },
  {
    title: "Contributions",
    body: "Submit work as an IPFS receipt. Owners accept and assign share in basis points. Revenue splits sum to 100% on-chain; recipients withdraw with pull payments.",
    href: "/contribute",
    cta: "How contributing works",
    tag: "Revenue bps",
  },
] as const;

export function ProductPillars() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="pillars-heading">
      <div className="max-w-2xl">
        <h2 id="pillars-heading" className="text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Three loops, one marketplace
        </h2>
        <p className="mt-3 text-paper/55">
          Each flow is designed so smart contracts hold funds and emit canonical events, while the app
          stays fast by reading indexed state from Postgres.
        </p>
      </div>
      <ul className="mt-12 grid gap-6 lg:grid-cols-3">
        {pillars.map((p) => (
          <li
            key={p.title}
            className="group flex flex-col rounded-2xl border border-white/[0.06] bg-ink-muted/60 p-6 transition hover:border-brand/30 hover:bg-ink-soft/80"
          >
            <span className="font-mono text-[11px] uppercase tracking-wider text-brand-bright/90">
              {p.tag}
            </span>
            <h3 className="mt-3 text-lg font-semibold text-paper">{p.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-paper/55">{p.body}</p>
            <Link
              href={p.href}
              className="mt-6 inline-flex items-center text-sm font-medium text-brand-bright transition group-hover:text-paper"
            >
              {p.cta}
              <span className="ml-1 transition group-hover:translate-x-0.5" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
