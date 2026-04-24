"use client";

import { useEffect, useMemo } from "react";

import type { RankingRow } from "@/lib/bounty-ranking-placeholder";
import type { UserActivityProfile } from "@/lib/bounty-ranking-activity";

function heatCellClass(i: number) {
  if (i <= 0) return "bg-white/[0.06]";
  if (i === 1) return "bg-emerald-500/25";
  if (i === 2) return "bg-emerald-400/40";
  if (i === 3) return "bg-brand/45";
  return "bg-brand-bright/70 shadow-[0_0_10px_rgba(196,181,253,0.45)]";
}

function ClaimSparkline({ claims }: { claims: readonly { usdc: number; date: string }[] }) {
  const points = useMemo(() => {
    const sorted = [...claims].sort((a, b) => a.date.localeCompare(b.date));
    let acc = 0;
    const pts: { x: number; y: number }[] = [];
    sorted.forEach((c, i) => {
      acc += c.usdc;
      const x = sorted.length <= 1 ? 50 : (i / (sorted.length - 1)) * 100;
      pts.push({ x, y: acc });
    });
    const maxY = Math.max(...pts.map((p) => p.y), 1);
    return pts.map((p) => ({
      x: p.x,
      y: 36 - (p.y / maxY) * 30,
    }));
  }, [claims]);

  const d = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  }, [points]);

  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-6 text-center text-xs text-paper/45">
        Not enough claim points for a trend line.
      </div>
    );
  }

  return (
    <svg viewBox="0 0 100 40" className="h-24 w-full overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke="rgb(196,181,253)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.8" fill="rgb(244,240,235)" opacity="0.9" />
      ))}
    </svg>
  );
}

export function RankingUserDrawer({
  row,
  activity,
  onClose,
}: {
  row: RankingRow | null;
  activity: UserActivityProfile | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  useEffect(() => {
    if (!row) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [row]);

  if (!row || !activity) return null;

  const claimsSorted = [...activity.claims].sort((a, b) => b.date.localeCompare(a.date));
  const totalClaimed = activity.claims.reduce((s, c) => s + c.usdc, 0);
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"] as const;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]"
        aria-label="Close profile"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="km-rank-drawer-title"
        className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-white/10 bg-ink-muted shadow-[0_0_80px_rgba(0,0,0,0.65)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-5">
          <div className="min-w-0">
            <p id="km-rank-drawer-title" className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-bright/90">
              On-chain activity (mock)
            </p>
            <p className="mt-2 truncate font-mono text-lg font-semibold text-paper">{row.wallet}</p>
            <p className="mt-1 font-mono text-xs text-paper/45">
              Rank #{row.rank} · index {row.score.toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg text-paper/60 transition hover:border-white/25 hover:text-paper"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-5 pb-10">
          <section aria-label="Streak">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3">
              <div
                className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-orange-500/50 via-rose-500/35 to-brand/30 shadow-inner shadow-black/40"
                aria-hidden
              />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Resolve streak</p>
                <p className="text-sm text-paper/75">
                  <span className="font-semibold text-brand-bright">{activity.streakDays}</span> mock days with
                  on-chain touchpoints
                </p>
              </div>
            </div>
          </section>

          <section aria-label="Contribution heatmap">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-paper/45">Answer intensity</p>
                <p className="mt-0.5 text-xs text-paper/40">Git-style grid · darker = busier week-day (fake)</p>
              </div>
              <span className="font-mono text-[9px] text-paper/30">14 wks</span>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="flex shrink-0 flex-col justify-between py-0.5 font-mono text-[9px] leading-none text-paper/30">
                {dayLabels.map((d) => (
                  <span key={d} className="flex h-2.5 items-center">
                    {d}
                  </span>
                ))}
              </div>
              <div className="flex min-w-0 flex-1 gap-[3px] overflow-x-auto pb-1">
                {activity.heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
                    {week.map((intensity, di) => (
                      <div
                        key={di}
                        className={`h-2.5 w-2.5 rounded-sm ${heatCellClass(intensity)}`}
                        title={`W${wi + 1} · ${dayLabels[di]} · level ${intensity}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[9px] text-paper/35">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-sm ${heatCellClass(i)}`} />
              ))}
              <span>More</span>
            </div>
          </section>

          <section aria-label="Cumulative claimed USDC">
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper/45">Cumulative claimed (USDC)</p>
            <p className="mt-1 text-xs text-paper/40">Area under mock pulls — not a wallet balance.</p>
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2">
              <ClaimSparkline claims={activity.claims} />
            </div>
          </section>

          <section aria-label="Claimed rewards">
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper/45">Reward ledger</p>
            <p className="mt-1 text-xs text-paper/40">
              Like a Git review log — each row is a mocked <code className="font-mono text-paper/50">withdraw</code> or
              bounty settlement.
            </p>
            <p className="mt-3 font-mono text-sm text-paper/70">
              Total pulled: <span className="text-brand-bright">${totalClaimed.toLocaleString()}</span>
            </p>
            <ol className="relative mt-6 space-y-0 border-l border-white/10 pl-5">
              {claimsSorted.map((c) => (
                <li key={c.id} className="relative pb-8 last:pb-0">
                  <span
                    className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-brand/40 bg-brand/30"
                    aria-hidden
                  />
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">{c.date}</p>
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[9px] uppercase ${
                          c.kind === "bounty_win"
                            ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200/90"
                            : "border border-white/10 bg-white/[0.06] text-paper/55"
                        }`}
                      >
                        {c.kind === "bounty_win" ? "Bounty" : "Withdraw"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-snug text-paper/85">{c.title}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                      <span className="text-brand-bright">+${c.usdc.toLocaleString()} USDC</span>
                      <span className="truncate text-paper/35">{c.txShort}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
