"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const STEP_HINTS: readonly string[] = [
  "Each step is one slice of the system — use the dots or arrow to move.",
  "Contracts hold funds and rules; the indexer keeps feeds fast.",
  "Bounty flow: lock USDC → answers → votes → resolve after the deadline.",
  "Premium stays encrypted until access is confirmed on-chain.",
  "Splits use bps (10,000 = 100%) — everyone withdraws their own share.",
  "AI is for UX only — payouts and keys follow protocol + DB proofs.",
];

const MAX_LEN = 2000;

function BotIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="6" y="10" width="28" height="22" rx="6" className="fill-brand/35 stroke-brand-bright/80" strokeWidth="1.2" />
      <circle cx="16" cy="21" r="2.2" className="fill-paper/90" />
      <circle cx="24" cy="21" r="2.2" className="fill-paper/90" />
      <path d="M14 26h12" className="stroke-brand-bright/70" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 4v6" className="stroke-brand-bright/60" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="3" r="2" className="fill-brand-bright/90" />
    </svg>
  );
}

export function JourneyGuideBot({ activeIndex }: { activeIndex: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const inputId = useId();
  const panelId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hint = useMemo(() => {
    const i = Math.min(Math.max(0, activeIndex), STEP_HINTS.length - 1);
    return STEP_HINTS[i] ?? STEP_HINTS[0];
  }, [activeIndex]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const trimmed = question.trim();
  const canSubmit = trimmed.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    router.push(`/questions/new?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  return (
    <div
      className="pointer-events-none fixed right-3 z-[25] flex flex-col items-end sm:right-5"
      style={{ bottom: "max(7.5rem, calc(6.5rem + env(safe-area-inset-bottom, 0px)))" }}
    >
      <div
        className={`pointer-events-auto w-[min(22rem,calc(100vw-2.25rem))] rounded-2xl border border-white/12 bg-ink-muted/95 p-3 shadow-lg shadow-black/50 backdrop-blur-md transition duration-200 sm:p-4 ${
          open ? "mb-2 translate-y-0 opacity-100" : "pointer-events-none mb-0 translate-y-1 opacity-0"
        }`}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${panelId}-title`}
        aria-hidden={!open}
      >
        <p id={`${panelId}-title`} className="font-mono text-[10px] font-medium uppercase tracking-wider text-brand-bright/90">
          Ask a question
        </p>
        <p className="mt-1.5 text-[11px] leading-snug text-paper/45 sm:text-xs">{hint}</p>
        <label htmlFor={inputId} className="sr-only">
          Question text
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          rows={3}
          maxLength={MAX_LEN}
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, MAX_LEN))}
          placeholder="Type your bounty or product question…"
          className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-paper placeholder:text-paper/35 focus:border-brand/45 focus:outline-none focus:ring-1 focus:ring-brand/40"
        />
        <div className="mt-1 flex justify-end">
          <span className="font-mono text-[10px] text-paper/30">
            {question.length}/{MAX_LEN}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-paper/60 transition hover:border-white/20 hover:text-paper"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-paper shadow-md shadow-brand/25 transition hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to new bounty
          </button>
        </div>
      </div>

      <div className="pointer-events-auto relative h-[5.5rem] w-[5.5rem] sm:h-24 sm:w-24">
        <div className="km-guide-bot-wander absolute left-1/2 top-1/2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/40 bg-brand/20 text-brand-bright shadow-[0_0_20px_rgba(124,58,237,0.35)] transition hover:border-brand-bright/60 hover:bg-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright sm:h-12 sm:w-12"
            aria-label={open ? "Close question panel" : "Open question panel"}
            aria-expanded={open}
            aria-controls={panelId}
            aria-haspopup="dialog"
          >
            <BotIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
