"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const SEEN_KEY = "km_home_splash_seen";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HomeSplash({ onDone }: { onDone: () => void }) {
  const sp = useSearchParams();
  const force = sp.get("splash") === "1";
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduced) {
      try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
      const t = setTimeout(() => { setVisible(false); onDone(); }, 180);
      return () => clearTimeout(t);
    }

    // Start exit animation then call onDone after it finishes
    const t1 = setTimeout(() => setVisible(false), 820);
    return () => clearTimeout(t1);
  }, [force, onDone, reduced]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink"
          role="dialog"
          aria-label="Welcome"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pointer-events-none absolute inset-0 km-chain-grid opacity-[0.08]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 opacity-[0.55]" aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(124,58,237,0.42),transparent_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(196,181,253,0.12),transparent_50%)]" />
          </div>

          <motion.div
            className="relative flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className={`relative flex h-24 w-24 items-center justify-center rounded-3xl border border-brand/35 bg-white/[0.03] shadow-[0_0_0_1px_rgba(124,58,237,0.10),0_0_34px_rgba(124,58,237,0.25)] ${
                reduced ? "" : "km-splash-spin"
              }`}
              whileHover={reduced ? {} : { scale: 1.06 }}
              aria-hidden
            >
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_25%,rgba(196,181,253,0.24),transparent_55%)]" />
              <Image src="/logo.svg" alt="" width={54} height={54} priority className="relative" />
            </motion.div>
            <div className="text-center">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-brand-bright/90">
                KnowMarket
              </p>
              <p className="mt-2 text-sm text-paper/55">Web3 knowledge marketplace</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function shouldShowHomeSplash(): boolean {
  if (typeof window === "undefined") return false;
  const reduced = prefersReducedMotion();
  if (reduced) return false;
  const sp = new URLSearchParams(window.location.search);
  if (sp.get("splash") === "1") return true;
  try {
    return localStorage.getItem(SEEN_KEY) !== "1";
  } catch {
    return false;
  }
}
