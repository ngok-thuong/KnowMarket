export function TrustStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-label="Trust and scope">
      <div className="rounded-2xl border border-brand/25 bg-brand/5 px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-paper">AI stays out of payouts</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper/55">
              Models may rank answers or summarize threads for UX only. Winners, refunds, and revenue
              shares come from contracts and indexed events — never from an LLM decision.
            </p>
          </div>
          <ul className="shrink-0 space-y-2 font-mono text-xs text-paper/45">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" aria-hidden />
              EVM + ERC-20 (e.g. USDC)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" aria-hidden />
              Plaintext premium never on IPFS
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" aria-hidden />
              Pull withdrawals, no push loops
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
