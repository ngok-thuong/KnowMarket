"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

const DRAFT_KEY = "km-bounty-draft-v1";

type DraftShape = {
  title: string;
  body: string;
  bountyUsdc: string;
  deadlineLocal: string;
  token: string;
  updatedAt: string;
};

const flow = [
  "Connect wallet",
  "Approve USDC allowance",
  "Call createQuestion(bounty, token, questionCid, deadline)",
  "Indexer picks up QuestionCreated",
] as const;

function loadDraft(): Partial<DraftShape> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DraftShape;
  } catch {
    return {};
  }
}

export function NewBountyView({ initialBody = "" }: { initialBody?: string }) {
  const formId = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(initialBody);
  const [bountyUsdc, setBountyUsdc] = useState("50");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [token, setToken] = useState("USDC");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const d = loadDraft();
    if (d.title) setTitle(d.title);
    setBody(initialBody || d.body || "");
    if (d.bountyUsdc) setBountyUsdc(d.bountyUsdc);
    if (d.deadlineLocal) setDeadlineLocal(d.deadlineLocal);
    if (d.token) setToken(d.token);
  }, [initialBody]);

  const saveDraft = useCallback(() => {
    const payload: DraftShape = {
      title,
      body,
      bountyUsdc,
      deadlineLocal,
      token,
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setSavedMsg("Draft saved in this browser only.");
      window.setTimeout(() => setSavedMsg(null), 3200);
    } catch {
      setSavedMsg("Could not save (storage blocked?).");
      window.setTimeout(() => setSavedMsg(null), 3200);
    }
  }, [title, body, bountyUsdc, deadlineLocal, token]);

  return (
    <div className="relative min-h-[70vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(22rem,48vh)] opacity-[0.32]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_70%_-8%,rgba(124,58,237,0.42),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_35%,rgba(52,211,153,0.1),transparent_42%)]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav className="font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <Link href="/questions" className="text-brand-bright/90 transition hover:text-paper">
            Bounty Q&A
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <span className="text-paper/60">New bounty</span>
        </nav>

        <header className="mt-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-bright/95">Create</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-paper sm:text-4xl">New bounty</h1>
          <p className="mt-3 text-base leading-relaxed text-paper/55">
            Compose your question here. On-chain creation will upload the question body to IPFS, lock USDC in escrow,
            and emit <code className="rounded bg-white/[0.06] px-1 font-mono text-sm text-brand-bright/90">QuestionCreated</code>{" "}
            — wiring comes in a later milestone.
          </p>
        </header>

        <ol className="mt-8 space-y-2 rounded-2xl border border-white/[0.08] bg-ink-muted/40 p-4 sm:p-5" aria-label="On-chain flow">
          {flow.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-paper/60">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-brand/30 bg-brand/10 font-mono text-[10px] font-semibold text-brand-bright">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <form
          id={formId}
          className="mt-10 space-y-6 rounded-2xl border border-white/[0.08] bg-ink-muted/35 p-5 sm:p-8"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label htmlFor={`${formId}-title`} className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Title
            </label>
            <input
              id={`${formId}-title`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short headline for the bounty"
              maxLength={200}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-paper placeholder:text-paper/35 focus:border-brand/45 focus:outline-none focus:ring-1 focus:ring-brand/35"
            />
          </div>

          <div>
            <label htmlFor={`${formId}-body`} className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Question body
            </label>
            <textarea
              id={`${formId}-body`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Context, constraints, acceptance criteria…"
              rows={8}
              maxLength={8000}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm leading-relaxed text-paper placeholder:text-paper/35 focus:border-brand/45 focus:outline-none focus:ring-1 focus:ring-brand/35"
            />
            <p className="mt-1 text-right font-mono text-[10px] text-paper/30">{body.length} / 8000</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${formId}-bounty`}
                className="font-mono text-[10px] uppercase tracking-wider text-paper/45"
              >
                Bounty (USDC)
              </label>
              <input
                id={`${formId}-bounty`}
                type="text"
                inputMode="decimal"
                value={bountyUsdc}
                onChange={(e) => setBountyUsdc(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.00"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 font-mono text-sm text-paper placeholder:text-paper/35 focus:border-brand/45 focus:outline-none focus:ring-1 focus:ring-brand/35"
              />
            </div>
            <div>
              <label
                htmlFor={`${formId}-token`}
                className="font-mono text-[10px] uppercase tracking-wider text-paper/45"
              >
                Payout token
              </label>
              <select
                id={`${formId}-token`}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-paper focus:border-brand/45 focus:outline-none focus:ring-1 focus:ring-brand/35"
              >
                <option value="USDC">USDC</option>
              </select>
              <p className="mt-1 text-xs text-paper/35">MVP: USDC only on target chains.</p>
            </div>
          </div>

          <div>
            <label
              htmlFor={`${formId}-deadline`}
              className="font-mono text-[10px] uppercase tracking-wider text-paper/45"
            >
              Voting / answer deadline (local time)
            </label>
            <input
              id={`${formId}-deadline`}
              type="datetime-local"
              value={deadlineLocal}
              onChange={(e) => setDeadlineLocal(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 font-mono text-sm text-paper focus:border-brand/45 focus:outline-none focus:ring-1 focus:ring-brand/35"
            />
            <p className="mt-1 text-xs text-paper/35">Will be converted to a block timestamp or unix time on-chain.</p>
          </div>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs leading-relaxed text-paper/55">
            <strong className="text-paper/70">Heads up:</strong> plaintext here is for drafting only. The real flow will
            encrypt or upload a CID before <code className="font-mono text-paper/60">createQuestion</code> per product
            spec — do not paste secrets.
          </div>

          <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-paper transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              Save draft locally
            </button>
            <button
              type="button"
              disabled
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-paper opacity-45 shadow-lg shadow-brand/20"
              title="Contract + IPFS upload not wired in this build"
            >
              Create on-chain (soon)
            </button>
          </div>
          {savedMsg ? <p className="text-center text-xs text-emerald-200/80">{savedMsg}</p> : null}
        </form>
      </div>
    </div>
  );
}
