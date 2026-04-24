"use client";

import { JourneyGuideBot } from "@/components/home/journey-guide-bot";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Step = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  body: ReactNode;
  /** Optional right column on large screens — diagrams, stats, secondary scan. */
  aside?: ReactNode;
  footer?: ReactNode;
};

function ChipRow({ labels }: { labels: readonly string[] }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tech highlights">
      {labels.map((l) => (
        <li
          key={l}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-paper/65"
        >
          {l}
        </li>
      ))}
    </ul>
  );
}

function StatCards({ items }: { items: readonly { label: string; value: string; hint: string }[] }) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-white/[0.07] bg-ink/50 p-5 transition hover:border-brand/25"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand-bright/80">{it.label}</p>
          <p className="mt-2 text-lg font-semibold text-paper">{it.value}</p>
          <p className="mt-2 text-xs leading-relaxed text-paper/45">{it.hint}</p>
        </div>
      ))}
    </div>
  );
}

function AsideShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-inner shadow-black/20 sm:p-8">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-brand-bright/85">{title}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function VerticalFlow({ steps: flowSteps }: { steps: readonly string[] }) {
  return (
    <ol className="space-y-0">
      {flowSteps.map((label, i) => (
        <li key={label} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/40 bg-brand/15 font-mono text-xs font-semibold text-brand-bright">
              {i + 1}
            </span>
            {i < flowSteps.length - 1 ? (
              <span className="my-1 block h-10 w-px bg-gradient-to-b from-brand/50 via-brand/20 to-transparent" aria-hidden />
            ) : null}
          </div>
          <div className="pb-8 pt-1.5">
            <p className="text-sm font-medium leading-snug text-paper">{label}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function CheckGrid({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
      {items.map((t) => (
        <li
          key={t}
          className="flex gap-3 rounded-xl border border-white/[0.06] bg-ink/40 px-4 py-3 text-sm text-paper/60"
        >
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[10px] text-brand-bright">
            ✓
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function CodeSnippet({ title, lines }: { title: string; lines: readonly string[] }) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div className="border-b border-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-paper/40">
        {title}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-paper/55 sm:text-xs">
        {lines.join("\n")}
      </pre>
    </div>
  );
}

function BpsBarRow() {
  const rows = [
    { label: "Creator", pct: 72, tone: "bg-brand" },
    { label: "Contributors", pct: 18, tone: "bg-brand-bright/80" },
    { label: "Platform", pct: 10, tone: "bg-paper/25" },
  ] as const;
  return (
    <div className="mt-8 space-y-4">
      <p className="text-xs font-medium uppercase tracking-wider text-paper/40">Example split (illustrative)</p>
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-xs text-paper/55">
            <span>{r.label}</span>
            <span className="font-mono text-paper/40">{r.pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
      <p className="text-xs text-paper/40">Real shares are set on-chain per post; totals must equal 10,000 bps.</p>
    </div>
  );
}

function FeedPlaceholders() {
  const cards = [
    { t: "Open bounties", s: "USDC locked · votes · deadlines" },
    { t: "Recent posts", s: "Preview + premium flags" },
    { t: "Pending contributions", s: "Receipt CIDs · owner review" },
  ] as const;
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.t}
          className="rounded-xl border border-white/[0.07] bg-ink/45 px-4 py-6 transition hover:border-brand/20"
        >
          <p className="font-mono text-[11px] text-brand-bright/90">{c.t}</p>
          <p className="mt-2 text-xs leading-relaxed text-paper/45">{c.s}</p>
        </div>
      ))}
    </div>
  );
}

const steps: Step[] = [
  {
    id: "vision",
    kicker: "KnowMarket",
    title: "A Web3-native knowledge marketplace",
    subtitle:
      "Ask with a USDC bounty, buy encrypted premium knowledge, and split revenue with contributors — rules on-chain, fast feeds from the indexer.",
    body: (
      <>
        <p className="max-w-2xl text-lg leading-relaxed text-paper/65">
          Every flow uses contracts for funds and canonical events, with Postgres updated by an indexer worker so the UI stays responsive after transactions confirm.
        </p>
        <ChipRow labels={["EVM", "ERC-20 · USDC", "IPFS CIDs", "Indexer → Postgres", "Wallet SIWE"]} />
        <StatCards
          items={[
            {
              label: "Source of truth",
              value: "Contracts",
              hint: "Escrow, access, and revenue rules live in verified bytecode — not in app config flags.",
            },
            {
              label: "Fast reads",
              value: "Indexed SQL",
              hint: "Feeds and detail pages hit the API backed by materialized on-chain state with confirmation depth.",
            },
            {
              label: "Sensitive data",
              value: "Client-side",
              hint: "Premium plaintext and keys stay off IPFS; encryption happens before upload.",
            },
          ]}
        />
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-paper/50">
          Modern product sites often lead with one hero line, then layer proof: stack, integrations, and how data moves.
          Below, each step adds a concrete slice of the system so visitors see depth, not only a tagline.
        </p>
      </>
    ),
    aside: (
      <AsideShell title="How data moves">
        <VerticalFlow
          steps={[
            "Wallets broadcast txs to contracts (QnA, Content, splits)",
            "Nodes emit logs; indexer waits confirmations, then upserts rows idempotently",
            "API serves feeds, auth, and key delivery after DB proofs line up",
            "Next.js shows pending → confirmed UX without polling chain for every read",
          ]}
        />
      </AsideShell>
    ),
    footer: (
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/questions"
          className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-paper shadow-lg shadow-brand/25 transition hover:bg-brand-dim"
        >
          Browse open questions
        </Link>
        <Link
          href="/posts"
          className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-paper transition hover:border-brand/45 hover:bg-white/[0.08]"
        >
          View posts
        </Link>
      </div>
    ),
  },
  {
    id: "loops",
    kicker: "Three loops",
    title: "One platform, three pillars",
    subtitle:
      "Bounty Q&A, encrypted premium paywall, and a contribution marketplace — one architecture: on-chain for money and rules, off-chain for feeds and UX.",
    body: (
      <>
        <p className="max-w-2xl text-paper/55">
          You can enter from any pillar; they share the same pending-state UX and the same trust model: contracts
          escrow or gate access, humans and indexers observe events, wallets sign intent.
        </p>
        <ul className="mt-8 max-w-2xl space-y-5 text-paper/60">
          <li className="flex gap-4 border-l-2 border-brand/45 pl-5">
            <span className="font-mono text-xs text-brand-bright">01</span>
            <span>
              <strong className="text-paper/80">Bounty Q&A.</strong> Escrow bounty → free answers → voting →
              permissionless resolve after the deadline. No asker click to “release funds”.
            </span>
          </li>
          <li className="flex gap-4 border-l-2 border-brand/30 pl-5">
            <span className="font-mono text-xs text-brand-bright">02</span>
            <span>
              <strong className="text-paper/80">Premium posts.</strong> Client-side encryption, IPFS ciphertext,
              on-chain purchase, then the key service delivers the decryption key once the indexer confirms access.
            </span>
          </li>
          <li className="flex gap-4 border-l-2 border-brand/18 pl-5">
            <span className="font-mono text-xs text-brand-bright">03</span>
            <span>
              <strong className="text-paper/80">Contributions.</strong> IPFS receipts, owner assigns share (bps),
              totals to 100% — pull withdrawals only, no treasury push loops.
            </span>
          </li>
        </ul>
      </>
    ),
    aside: (
      <AsideShell title="At a glance">
        <div className="space-y-4">
          {(
            [
              { h: "Bounty Q&A", t: "Vote-to-resolve QnA with USDC escrow", tag: "QnA.sol" },
              { h: "Premium", t: "Pay-to-decrypt with IPFS envelope + keys", tag: "Content.sol" },
              { h: "Splits", t: "bps map to recipients; pull withdraw()", tag: "Revenue" },
            ] as const
          ).map((c) => (
            <div key={c.h} className="rounded-xl border border-white/[0.07] bg-ink/50 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-brand-bright/85">{c.tag}</p>
              <p className="mt-1 text-sm font-semibold text-paper">{c.h}</p>
              <p className="mt-1 text-xs leading-relaxed text-paper/45">{c.t}</p>
            </div>
          ))}
        </div>
      </AsideShell>
    ),
  },
  {
    id: "bounty",
    kicker: "Bounty Q&A",
    title: "Paid questions, open answers",
    subtitle:
      "Lock USDC on a question. Answers are free to submit. One vote per wallet. After the deadline, anyone can resolve — the winning answer receives the escrow per contract.",
    body: (
      <>
        <p className="max-w-2xl text-paper/60">
          No manual asker approval to pay out; the UI tracks approve → transaction → indexer confirmed on the pending
          path. Event names are part of the public spec so indexers and explorers stay aligned.
        </p>
        <CheckGrid
          items={[
            "Canonical events: QuestionCreated, AnswerSubmitted, VoteCast, QuestionResolved",
            "One vote per wallet per question (enforced off-chain in DB + on-chain rules in spec)",
            "If votes tie or are empty, contracts define refund / treasury behaviour — not the UI",
            "Readers always see indexer-backed counts; writers see tx + confirmation state",
          ]}
        />
      </>
    ),
    aside: (
      <AsideShell title="Lifecycle">
        <VerticalFlow
          steps={[
            "Create question + lock bounty (ERC20 transferFrom)",
            "Answerers publish answer CID; voters pick favourite",
            "Deadline passes; anyone calls resolve",
            "Escrow routes to winner or refund path per contract",
          ]}
        />
      </AsideShell>
    ),
    footer: (
      <Link
        href="/questions"
        className="mt-10 inline-flex text-sm font-medium text-brand-bright transition hover:text-paper"
      >
        Open Q&A →
      </Link>
    ),
  },
  {
    id: "premium",
    kicker: "Premium posts",
    title: "Paid content, plaintext never on IPFS",
    subtitle:
      "Creators encrypt in the browser, upload ciphertext to IPFS, and set a price. Buyers pay on-chain; after N blocks the indexer confirms and the key service returns the decryption key.",
    body: (
      <>
        <p className="max-w-2xl text-paper/60">
          AI may rank previews or summarize public metadata for UX — it never decides who receives a decryption key.
          Keys are only released when the access row is confirmed and the wallet proves control via the auth flow.
        </p>
        <CheckGrid
          items={[
            "Envelope: XChaCha20-Poly1305 + AAD bound to post revision",
            "Key service stores wrapped keys; plaintext never logged",
            "Buyer path: purchase → wait confirmations → nonce + sig → key",
          ]}
        />
        <CodeSnippet
          title="IPFS envelope (schema v1, illustrative)"
          lines={[
            '{ "alg": "xchacha20poly1305",',
            '  "nonce": "<base64>",',
            '  "ciphertext": "<base64>",',
            '  "aad": "<base64 of postId:revision>",',
            '  "schema_version": 1 }',
          ]}
        />
      </>
    ),
    aside: (
      <AsideShell title="Creator → buyer">
        <VerticalFlow
          steps={[
            "Generate content key; encrypt bundle in-browser",
            "Upload ciphertext CID; store wrapped key via authenticated API",
            "List price + preview on-chain; buyers pay AccessPurchased",
            "Indexer confirms; buyer fetches key and decrypts locally",
          ]}
        />
      </AsideShell>
    ),
    footer: (
      <Link
        href="/posts"
        className="mt-10 inline-flex text-sm font-medium text-brand-bright transition hover:text-paper"
      >
        Explore posts →
      </Link>
    ),
  },
  {
    id: "contribute",
    kicker: "Contributions",
    title: "Transparent revenue splits",
    subtitle:
      "Submit work receipts (IPFS CIDs). Owners accept and assign shareBps. Totals sum to 10,000 bps; everyone withdraws their share via pull payments.",
    body: (
      <>
        <p className="max-w-2xl text-paper/60">
          Fits long-form premium, research artefacts, or engineering work where multiple wallets should share ongoing
          revenue. Owners retain moderation: accept or reject receipts, but cannot silently change totals once
          published on-chain.
        </p>
        <BpsBarRow />
        <p className="mt-6 max-w-2xl text-sm text-paper/45">
          Contributors see their assigned bps in the UI; withdrawals are explicit transactions — easier to reason about
          than invisible cron payouts.
        </p>
      </>
    ),
    aside: (
      <AsideShell title="Why pull payments">
        <ul className="space-y-3 text-sm leading-relaxed text-paper/55">
          <li className="flex gap-2">
            <span className="text-brand-bright">→</span>
            Avoids reentrancy and surprise transfers when recipient lists change.
          </li>
          <li className="flex gap-2">
            <span className="text-brand-bright">→</span>
            Gas is paid by whoever withdraws, keeping the core contract simpler.
          </li>
          <li className="flex gap-2">
            <span className="text-brand-bright">→</span>
            Matches common ERC-20 pull patterns used by serious marketplaces.
          </li>
        </ul>
      </AsideShell>
    ),
    footer: (
      <Link
        href="/contribute"
        className="mt-10 inline-flex text-sm font-medium text-brand-bright transition hover:text-paper"
      >
        How contributing works →
      </Link>
    ),
  },
  {
    id: "trust",
    kicker: "Trust",
    title: "AI does not move money",
    subtitle:
      "Models may rank answers or summarize threads for UX. Winners, refunds, and revenue shares come from contracts and indexed events — never from an LLM.",
    body: (
      <>
        <ul className="mt-2 grid gap-3 font-mono text-xs text-paper/50 sm:grid-cols-2">
          <li className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ink-muted/40 px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-bright shadow-[0_0_12px_rgba(196,181,253,0.8)]" />
            EVM + ERC-20 (e.g. USDC)
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ink-muted/40 px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-bright shadow-[0_0_12px_rgba(196,181,253,0.8)]" />
            Plaintext premium never on IPFS
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ink-muted/40 px-3 py-2.5 sm:col-span-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-bright shadow-[0_0_12px_rgba(196,181,253,0.8)]" />
            Pull withdrawals — avoids push loops / reentrancy risk
          </li>
        </ul>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-paper/50">
          This split is how serious Web3 products document themselves: a thin AI layer for comprehension, a thick
          protocol layer for value. Visitors should leave knowing which subsystem owns payouts.
        </p>
        <FeedPlaceholders />
      </>
    ),
    aside: (
      <AsideShell title="Separation of roles">
        <div className="grid gap-4">
          <div className="rounded-xl border border-brand/25 bg-brand/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-brand-bright">AI surface</p>
            <p className="mt-2 text-sm text-paper/70">Ranking, summaries, diff highlights — read-only over indexed data.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink/60 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper/50">Settlement surface</p>
            <p className="mt-2 text-sm text-paper/70">
              Wallets, contracts, indexer, key service — deterministic pipelines with audit trails.
            </p>
          </div>
        </div>
      </AsideShell>
    ),
    footer: (
      <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-paper">Live feeds</p>
          <p className="mt-1 max-w-md text-xs text-paper/45">
            Bounty lists, posts, and contribution queues will load from the API backed by the indexer. Cards above are
            layout placeholders until those endpoints ship.
          </p>
        </div>
        <Link
          href="/questions"
          className="shrink-0 text-sm font-medium text-brand-bright hover:text-paper"
        >
          Go to questions →
        </Link>
      </div>
    ),
  },
];

/** One visual layer per homepage step — crossfades with `activeIndex`. */
const journeyBackdropLayers: { bg: string; gridLine: string; hexColor: string }[] = [
  {
    bg: `radial-gradient(ellipse 100% 65% at 50% -8%, rgba(124,58,237,0.55) 0%, transparent 48%),
      radial-gradient(circle at 92% 78%, rgba(91,33,182,0.4) 0%, transparent 42%), #0a0c10`,
    gridLine: "rgba(124, 58, 237, 0.1)",
    hexColor: "rgba(196, 181, 253, 0.38)",
  },
  {
    bg: `radial-gradient(ellipse 80% 50% at 82% 8%, rgba(34,211,238,0.2) 0%, transparent 46%),
      radial-gradient(circle at 10% 88%, rgba(124,58,237,0.38) 0%, transparent 42%), #0a0c10`,
    gridLine: "rgba(94, 234, 212, 0.1)",
    hexColor: "rgba(153, 246, 228, 0.32)",
  },
  {
    bg: `radial-gradient(ellipse 72% 58% at 42% -2%, rgba(52,211,153,0.26) 0%, transparent 50%),
      radial-gradient(circle at 88% 72%, rgba(124,58,237,0.34) 0%, transparent 44%), #0a0c10`,
    gridLine: "rgba(52, 211, 153, 0.11)",
    hexColor: "rgba(167, 243, 208, 0.34)",
  },
  {
    bg: `radial-gradient(ellipse 78% 58% at 52% -6%, rgba(96,165,250,0.32) 0%, transparent 48%),
      radial-gradient(circle at 14% 82%, rgba(124,58,237,0.36) 0%, transparent 46%), #0a0c10`,
    gridLine: "rgba(96, 165, 250, 0.11)",
    hexColor: "rgba(186, 230, 253, 0.36)",
  },
  {
    bg: `radial-gradient(ellipse 88% 52% at 48% 4%, rgba(251,191,36,0.2) 0%, transparent 52%),
      radial-gradient(circle at 90% 28%, rgba(124,58,237,0.32) 0%, transparent 44%), #0a0c10`,
    gridLine: "rgba(251, 191, 36, 0.1)",
    hexColor: "rgba(253, 224, 71, 0.32)",
  },
  {
    bg: `radial-gradient(ellipse 62% 72% at 50% 102%, rgba(124,58,237,0.48) 0%, transparent 52%),
      radial-gradient(circle at 50% 32%, rgba(196,181,253,0.14) 0%, transparent 56%), #0a0c10`,
    gridLine: "rgba(167, 139, 250, 0.11)",
    hexColor: "rgba(196, 181, 253, 0.42)",
  },
];

function JourneyBackdrop({ activeIndex }: { activeIndex: number }) {
  const safe = Math.min(Math.max(0, activeIndex), journeyBackdropLayers.length - 1);
  const layer = journeyBackdropLayers[safe] ?? journeyBackdropLayers[0];
  const gridStyle = { ["--km-grid-line" as string]: layer.gridLine } as CSSProperties;
  const blobStyle = {
    filter: `hue-rotate(${safe * 20}deg)`,
    transition: "filter 1.35s ease",
  } as CSSProperties;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink" aria-hidden>
      {journeyBackdropLayers.map((L, i) => (
        <div
          key={steps[i]?.id ?? i}
          className={`km-backdrop-scene absolute inset-0 ${i === safe ? "z-[1] opacity-100" : "z-0 opacity-0"}`}
          style={{ background: L.bg }}
        />
      ))}
      <div className="absolute inset-0 z-[2] overflow-hidden" style={blobStyle}>
        <div className="absolute -left-1/4 top-1/4 h-[min(80vw,720px)] w-[min(80vw,720px)] rounded-full bg-brand/16 blur-[120px] km-breathe" />
        <div className="absolute -right-1/4 bottom-1/4 h-[min(70vw,560px)] w-[min(70vw,560px)] rounded-full bg-brand-dim/22 blur-[100px] km-breathe-delayed" />
      </div>
      <div
        className="km-journey-grid absolute inset-0 z-[3] opacity-[0.28]"
        style={gridStyle}
      />
      <svg
        className="km-hex-drift absolute inset-0 z-[4] h-full w-full opacity-[0.14]"
        style={{ color: layer.hexColor, transition: "color 1.2s ease" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="km-hex" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path
              d="M28 2 L52 16 L52 44 L28 58 L4 44 L4 16 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#km-hex)" />
      </svg>
    </div>
  );
}

function StepPanel({
  step,
  index,
  setRef,
}: {
  step: Step;
  index: number;
  setRef: (el: HTMLElement | null) => void;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fallback: if IntersectionObserver is unavailable, do not hide content.
 
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const bindRef = (node: HTMLElement | null) => {
    rootRef.current = node;
    setRef(node);
  };

  const hasAside = Boolean(step.aside);

  return (
    <section
      ref={bindRef}
      id={`home-step-${step.id}`}
      data-step-index={index}
      className="km-step-panel relative flex min-h-[100svh] snap-start snap-always flex-col items-stretch justify-center scroll-mt-0 border-b border-white/[0.04] px-4 pt-[calc(1rem+var(--km-site-header))] pb-[calc(1rem+var(--km-journey-dock))] sm:px-6 sm:pt-[calc(1.25rem+var(--km-site-header))] sm:pb-[calc(1.25rem+var(--km-journey-dock))]"
    >
      <div
        className={`relative mx-auto w-full max-w-7xl transition-all duration-700 ease-out ${
          visible ? "km-step-visible translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="rounded-3xl border border-white/[0.07] bg-ink-muted/35 p-8 shadow-[0_0_0_1px_rgba(124,58,237,0.06)] backdrop-blur-md sm:p-12 km-glass-shine">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-brand-bright/95">
            {step.kicker}
          </p>
          <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-paper sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
            {step.title}
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-paper/55 sm:text-lg">{step.subtitle}</p>
          <div
            className={
              hasAside
                ? "mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,26rem)] lg:items-start lg:gap-12"
                : "mt-8"
            }
          >
            <div>
              <div>{step.body}</div>
              {step.footer ? <div>{step.footer}</div> : null}
            </div>
            {hasAside ? (
              <aside className="lg:sticky lg:top-[min(12rem,18vh)] lg:self-start">{step.aside}</aside>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneyControls({
  activeIndex,
  total,
  onNext,
}: {
  activeIndex: number;
  total: number;
  onNext: () => void;
}) {
  const isLast = activeIndex >= total - 1;

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-4 pb-6 pt-10 sm:pb-8">
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-ink/80 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-md"
        role="navigation"
        aria-label="Homepage step navigation"
      >
        {steps.map((_, i) => (
          <button
            key={steps[i].id}
            type="button"
            aria-label={`Step ${i + 1}`}
            aria-current={i === activeIndex ? "step" : undefined}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-8 bg-brand-bright" : "w-2 bg-white/20 hover:bg-white/35"
            }`}
            onClick={() => {
              document.getElementById(`home-step-${steps[i].id}`)?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                block: "start",
              });
            }}
          />
        ))}
      </div>

      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          className="pointer-events-auto group flex h-14 w-14 items-center justify-center rounded-full border border-brand/40 bg-brand/15 text-brand-bright shadow-[0_0_24px_rgba(124,58,237,0.35)] transition hover:border-brand-bright/60 hover:bg-brand/25 hover:shadow-[0_0_32px_rgba(196,181,253,0.45)]"
          aria-label="Next step"
        >
          <span className="sr-only">Go to next step</span>
          <svg
            className="h-6 w-6 transition-transform duration-300 group-hover:translate-y-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <p className="pointer-events-auto text-center text-xs text-paper/40">
          Scroll up to revisit steps, or use the dots to jump quickly.
        </p>
      )}
    </div>
  );
}

export function HomeJourney() {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const setSectionRef = useCallback((index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("km-home-snap");
    return () => document.documentElement.classList.remove("km-home-snap");
  }, []);

  useEffect(() => {
    const nodes = () => sectionRefs.current.filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible?.target) return;
        const idx = Number((visible.target as HTMLElement).dataset.stepIndex);
        if (!Number.isNaN(idx)) setActiveIndex(idx);
      },
      { threshold: [0.35, 0.55], rootMargin: "-12% 0px -12% 0px" }
    );
    nodes().forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  const goNext = useCallback(() => {
    const next = Math.min(activeIndex + 1, steps.length - 1);
    const id = steps[next]?.id;
    const el = id ? document.getElementById(`home-step-${id}`) : null;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  }, [activeIndex]);

  return (
    <main className="relative [--km-journey-dock:7.5rem] [--km-site-header:4rem]">
      <JourneyBackdrop activeIndex={activeIndex} />
      <div className="sr-only">
        <h1>KnowMarket — Web3 knowledge marketplace</h1>
      </div>
      {steps.map((step, i) => (
        <StepPanel key={step.id} step={step} index={i} setRef={setSectionRef(i)} />
      ))}
      <JourneyControls activeIndex={activeIndex} total={steps.length} onNext={goNext} />
      <JourneyGuideBot activeIndex={activeIndex} />
    </main>
  );
}
