const steps = [
  {
    step: "01",
    title: "Connect & sign",
    body: "Use your wallet for on-chain actions and EIP-191 signed sessions for the API when auth is enabled.",
  },
  {
    step: "02",
    title: "Create or participate",
    body: "Post a bounty question, answer and vote, publish or buy premium content, or submit a contribution receipt.",
  },
  {
    step: "03",
    title: "Wait for confirmations",
    body: "The UI follows pending → indexer confirmed states. Payouts and access follow contract rules, not manual approval.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      className="border-y border-white/5 bg-ink-muted/40"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 id="how-heading" className="text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          How it feels in the app
        </h2>
        <p className="mt-3 max-w-2xl text-paper/55">
          Every write path follows the same pending pattern: approve tokens if needed, broadcast the
          transaction, then let the indexer move the row to confirmed.
        </p>
        <ol className="mt-12 grid gap-10 sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.step}>
              <span className="font-mono text-xs text-brand-bright/90">{s.step}</span>
              <h3 className="mt-2 text-lg font-medium text-paper">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/50">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
