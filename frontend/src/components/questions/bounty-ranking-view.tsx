"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { RankingUserDrawer } from "@/components/questions/ranking-user-drawer";
import { getRankingUserActivity } from "@/lib/bounty-ranking-activity";
import { BOUNTY_RANKING_PLACEHOLDER, rankingMaxima, type RankingRow } from "@/lib/bounty-ranking-placeholder";

const rows = BOUNTY_RANKING_PLACEHOLDER;
const { maxScore, maxVotes, maxUsdc } = rankingMaxima(rows);

function PodiumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M4 20h4v-6H4v6zm6 0h4V10h-4v10zm6 0h4V6h-4v14z"
        className="fill-current opacity-90"
      />
    </svg>
  );
}

function TrendPill({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="font-mono text-[10px] text-paper/35">0</span>;
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
        up ? "bg-emerald-400/12 text-emerald-200/90" : "bg-rose-400/10 text-rose-200/85"
      }`}
    >
      {up ? "▲" : "▼"}
      {up ? "+" : ""}
      {delta}
    </span>
  );
}

function WinRateRing({ pct }: { pct: number }) {
  const deg = Math.min(100, Math.max(0, pct)) * 3.6;
  return (
    <div
      className="relative mx-auto h-11 w-11 shrink-0"
      title={`Win rate (mock): ${pct}%`}
      aria-label={`Win rate about ${pct} percent`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from -90deg, rgba(196,181,253,0.95) 0deg ${deg}deg, rgba(255,255,255,0.06) ${deg}deg 360deg)`,
        }}
      />
      <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-ink-muted font-mono text-[10px] font-semibold text-paper/80">
        {pct}
      </div>
    </div>
  );
}

function MomentumBars({ row }: { row: RankingRow }) {
  const scorePct = Math.round((row.score / maxScore) * 100);
  const votesPct = Math.round((row.answersUpvoted / maxVotes) * 100);
  const payoutPct = Math.round((row.usdcEarned / maxUsdc) * 100);
  return (
    <div className="w-full min-w-[112px] max-w-[160px] space-y-1.5" aria-hidden>
      <div className="flex items-center gap-1.5">
        <span className="w-7 shrink-0 font-mono text-[9px] uppercase tracking-tighter text-paper/30">Idx</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand via-brand to-brand-bright/90 shadow-[0_0_12px_rgba(124,58,237,0.35)]"
            style={{ width: `${scorePct}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right font-mono text-[9px] text-paper/40">{scorePct}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-7 shrink-0 font-mono text-[9px] uppercase tracking-tighter text-paper/30">Eng</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-700/90 to-teal-400/75"
            style={{ width: `${votesPct}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right font-mono text-[9px] text-paper/40">{votesPct}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-7 shrink-0 font-mono text-[9px] uppercase tracking-tighter text-paper/30">$</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-700/70 to-amber-400/60"
            style={{ width: `${payoutPct}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right font-mono text-[9px] text-paper/40">{payoutPct}%</span>
      </div>
    </div>
  );
}

function PodiumCard({
  row,
  place,
  tall,
  onOpen,
}: {
  row: RankingRow;
  place: 1 | 2 | 3;
  tall: "short" | "mid" | "tall";
  onOpen: () => void;
}) {
  const heights = { short: "min-h-[7.5rem]", mid: "min-h-[9rem]", tall: "min-h-[11rem]" };
  const borders =
    place === 1
      ? "border-amber-300/35 bg-gradient-to-b from-amber-400/15 to-transparent"
      : place === 2
        ? "border-white/15 bg-gradient-to-b from-white/[0.08] to-transparent"
        : "border-orange-400/25 bg-gradient-to-b from-orange-400/12 to-transparent";
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };

  const floatDelay =
    place === 1 ? "km-rank-podium-float--delay-1" : place === 2 ? "km-rank-podium-float--delay-2" : "km-rank-podium-float--delay-3";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`km-rank-podium-float ${floatDelay} flex max-w-[11rem] flex-1 cursor-pointer flex-col rounded-2xl border px-4 pb-4 pt-5 text-center transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright sm:max-w-none ${heights[tall]} ${borders}`}
    >
      <span className="text-2xl" aria-hidden>
        {medals[place]}
      </span>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-paper/40">#{place}</p>
      <p className="mt-2 truncate font-mono text-xs font-medium text-paper/85">{row.wallet}</p>
      <p className="mt-2 font-mono text-xl font-semibold text-brand-bright">{row.score.toLocaleString()}</p>
      <p className="mt-0.5 font-mono text-[10px] text-paper/40">index</p>
      <p className="mt-2 font-mono text-xs text-paper/55">${row.usdcEarnedLabel}</p>
    </div>
  );
}

export function BountyRankingView() {
  const [openRank, setOpenRank] = useState<number | null>(null);

  const selectedRow = useMemo(() => rows.find((r) => r.rank === openRank) ?? null, [openRank]);
  const selectedActivity = useMemo(
    () => (openRank != null ? getRankingUserActivity(openRank) ?? null : null),
    [openRank]
  );

  const second = rows.find((r) => r.rank === 2);
  const first = rows.find((r) => r.rank === 1);
  const third = rows.find((r) => r.rank === 3);

  return (
    <div className="relative min-h-[60vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(24rem,50vh)] opacity-[0.3]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-5%,rgba(251,191,36,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(124,58,237,0.22),transparent_42%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav className="font-mono text-xs text-paper/45">
          <Link href="/" className="text-brand-bright/90 transition hover:text-paper">
            Home
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <Link href="/questions" className="text-brand-bright/90 transition hover:text-paper">
            Bounty Q&A
          </Link>
          <span className="mx-2 text-paper/25">/</span>
          <span className="text-paper/60">Ranking</span>
        </nav>

        <header className="mt-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-bright/95">Leaderboard</p>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-200/95">
              <PodiumIcon className="h-6 w-6" />
            </span>
            Contributor ranking
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-paper/55">
            Mock data: podium + <strong className="text-paper/70">skyline</strong> (score vs #1) and{" "}
            <strong className="text-paper/70">Momentum</strong> triple bars (index / engagement / estimated payout
            share). Easier to scan than digits alone — still no effect on real payouts.{" "}
            <span className="text-brand-bright/80">Tap a wallet or podium card</span> to open a mock activity drawer
            (heatmap + claimed rewards).
          </p>
        </header>

        {second && first && third ? (
          <section className="mt-10" aria-label="Top three podium">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">Podium</p>
            <div className="mt-3 flex max-w-xl flex-row items-end justify-center gap-2 sm:mx-auto sm:max-w-2xl sm:gap-4">
              <PodiumCard row={second} place={2} tall="mid" onOpen={() => setOpenRank(second.rank)} />
              <PodiumCard row={first} place={1} tall="tall" onOpen={() => setOpenRank(first.rank)} />
              <PodiumCard row={third} place={3} tall="short" onOpen={() => setOpenRank(third.rank)} />
            </div>
          </section>
        ) : null}

        <section className="mt-12 rounded-2xl border border-white/[0.08] bg-ink-muted/30 p-4 sm:p-5" aria-label="Score skyline">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45">Score skyline</p>
              <p className="mt-1 text-xs text-paper/45">
                All ranks — bar height vs #1 index ({maxScore.toLocaleString()}). Tap a column for activity (mock).
              </p>
            </div>
            <span className="font-mono text-[10px] text-paper/35">mock</span>
          </div>
          <div className="mt-5 flex h-32 items-end justify-between gap-1.5 sm:gap-2">
            {rows.map((row) => {
              const barPx = Math.max(14, Math.round((row.score / maxScore) * 104));
              const staggerMs = (row.rank - 1) * 52;
              const staggerStyle = { "--km-rank-stagger": `${staggerMs}ms` } as CSSProperties;
              return (
                <div key={row.rank} className="flex h-full min-h-0 flex-1 flex-col items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOpenRank(row.rank)}
                    className="group/bar flex w-full max-w-[2.75rem] flex-1 flex-col justify-end overflow-hidden rounded-t-lg border border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-bright sm:max-w-[3.25rem]"
                    title={`Open activity · rank ${row.rank}`}
                  >
                    <div className="relative w-full overflow-hidden rounded-t-lg" style={{ height: `${barPx}px`, ...staggerStyle }}>
                      <div className="km-rank-bar-rise absolute bottom-0 left-0 right-0 top-0 w-full" style={staggerStyle}>
                        <div
                          className={`h-full w-full rounded-t-lg bg-gradient-to-t transition group-hover/bar:ring-2 group-hover/bar:ring-brand/40 ${
                            row.rank <= 3
                              ? "from-brand/25 via-brand/50 to-brand-bright/85 shadow-[0_0_20px_rgba(124,58,237,0.25)] km-rank-bar-elite"
                              : "from-brand/15 to-brand/45"
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                  <span className="km-rank-label-reveal font-mono text-[10px] text-paper/40" style={staggerStyle}>
                    {row.rank}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-muted/35 shadow-inner shadow-black/20">
          <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Full standings</p>
            <p className="mt-1 text-xs text-paper/45">
              Columns: <span className="text-paper/60">7d Δ</span> (mock drift),{" "}
              <span className="text-paper/60">Win%</span> ring, <span className="text-paper/60">Momentum</span> bars =
              index / votes / USDC vs table max — quick mental math.{" "}
              <span className="text-brand-bright/75">Wallet column opens activity.</span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] font-mono text-[10px] uppercase tracking-wider text-paper/40">
                  <th className="px-3 py-3 pl-4 sm:pl-5">#</th>
                  <th className="px-3 py-3">Wallet</th>
                  <th className="px-3 py-3 text-right">Score</th>
                  <th className="px-3 py-3 text-center">7d</th>
                  <th className="px-3 py-3 text-center">Win</th>
                  <th className="px-3 py-3">Momentum</th>
                  <th className="px-3 py-3 text-right">Wins</th>
                  <th className="hidden px-3 py-3 text-right md:table-cell">Votes</th>
                  <th className="px-3 py-3 pr-4 text-right sm:pr-5">USDC</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.rank}
                    className="border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-4 pl-4 font-mono text-xs text-paper/50 sm:pl-5">
                      <span
                        className={
                          row.rank <= 3
                            ? "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 font-semibold text-amber-100/90"
                            : "inline-flex h-8 w-8 items-center justify-center text-paper/55"
                        }
                      >
                        {row.rank}
                      </span>
                    </td>
                    <td className="max-w-[10rem] px-3 py-4 sm:max-w-none">
                      <button
                        type="button"
                        onClick={() => setOpenRank(row.rank)}
                        className="max-w-full truncate text-left font-mono text-xs text-brand-bright/90 underline decoration-brand/30 underline-offset-2 transition hover:text-paper hover:decoration-paper/40 sm:text-sm"
                      >
                        {row.wallet}
                      </button>
                    </td>
                    <td className="px-3 py-4 text-right font-mono text-sm font-semibold text-brand-bright/95">
                      {row.score.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <TrendPill delta={row.velocity7d} />
                    </td>
                    <td className="px-3 py-4">
                      <WinRateRing pct={row.winRatePct} />
                    </td>
                    <td className="px-3 py-4">
                      <MomentumBars row={row} />
                    </td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-paper/65">{row.bountiesWon}</td>
                    <td className="hidden px-3 py-4 text-right font-mono text-xs text-paper/60 md:table-cell">
                      {row.answersUpvoted}
                    </td>
                    <td className="px-3 py-4 pr-4 text-right font-mono text-xs text-paper/75 sm:pr-5 sm:text-sm">
                      ${row.usdcEarnedLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-paper/35">
          Connect wallet to highlight your row — not in this scaffold. Charts normalize within this table only.
        </p>

        <RankingUserDrawer
          row={selectedRow}
          activity={selectedActivity}
          onClose={() => setOpenRank(null)}
        />
      </div>
    </div>
  );
}
