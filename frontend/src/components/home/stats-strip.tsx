"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { FadeUp, Stagger, StaggerItem } from "@/components/home/motion-primitives";

const rows = [
  { k: "Open bounties", v: 12, display: "12", hint: "Indexed SQL (placeholder)" },
  { k: "USDC escrow", v: 48200, display: "$48.2k", hint: "Contract escrow (placeholder)" },
  { k: "Premium purchases", v: 128, display: "128", hint: "Confirmed access (placeholder)" },
  { k: "Contrib receipts", v: 37, display: "37", hint: "Accepted + pending (placeholder)" },
] as const;

/** Counts up from 0 to `end` when `run` becomes true. */
function useCountUp(end: string, run: boolean): string {
  const [display, setDisplay] = useState("0");
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!run || reduced) {
      setDisplay(end);
      return;
    }
    // Only animate pure numbers; leave formatted strings (e.g. "$48.2k") as-is
    const num = parseFloat(end.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) {
      setDisplay(end);
      return;
    }

    const prefix = end.startsWith("$") ? "$" : "";
    const suffix = end.endsWith("k") ? "k" : "";
    const duration = 900;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * num * 10) / 10;

      if (suffix === "k") {
        setDisplay(`${prefix}${(current / 1000).toFixed(1)}${suffix}`);
      } else {
        setDisplay(`${prefix}${Math.round(current)}${suffix}`);
      }

      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(end);
    }

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, end, reduced]);

  return display;
}

function StatCard({ row, delay }: { row: (typeof rows)[number]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCountUp(row.display, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 320, damping: 22, delay }}
      className="border-b border-white/[0.06] p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:border-r-white/[0.06] lg:last:border-r-0"
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">{row.k}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-paper">{count}</p>
      <p className="mt-2 text-xs text-paper/45">{row.hint}</p>
    </motion.div>
  );
}

export function StatsStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-label="Activity snapshot">
      <FadeUp>
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-muted/40 shadow-inner shadow-black/25 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((r, i) => (
            <StatCard key={r.k} row={r} delay={i * 0.1} />
          ))}
        </div>
        <p className="mt-4 text-xs text-paper/40">
          Metrics will come from the API backed by indexer-confirmed state in Postgres.
        </p>
      </FadeUp>
    </section>
  );
}
