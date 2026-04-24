"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Stagger, StaggerItem } from "@/components/home/motion-primitives";

export function HeroSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Mouse parallax for the purple blob — smooth spring tracking
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const springX = useSpring(rawX, { stiffness: 60, damping: 18 });
  const springY = useSpring(rawY, { stiffness: 60, damping: 18 });

  // Map 0–1 mouse position to ±28px blob offset
  const blobX = useTransform(springX, [0, 1], [-28, 28]);
  const blobY = useTransform(springY, [0, 1], [-16, 16]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (reduced) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    rawX.set(0.5);
    rawY.set(0.5);
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-white/5"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Parallax purple blob */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(124,58,237,0.38),transparent)]"
        style={reduced ? {} : { x: blobX, y: blobY }}
        aria-hidden
      />
      {/* Subtle fade — keep transparent so blockchain network shows through */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,12,16,0.45)_0%,rgba(10,12,16,0.72)_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <Stagger staggerDelay={0.1}>
          {/* Tag line */}
          <StaggerItem effect="fadeUp">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-bright">
              Web3 knowledge marketplace
            </p>
          </StaggerItem>

          {/* Headline */}
          <StaggerItem effect="fadeUp">
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-paper sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Ask with a bounty. Publish premium knowledge. Split revenue with contributors —{" "}
              <span className="text-brand-bright">rules on-chain</span>, feeds from the indexer.
            </h1>
          </StaggerItem>

          {/* Sub-text */}
          <StaggerItem effect="fadeUp">
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/60">
              USDC escrow for Q&A, vote-based resolve after the deadline, client-side encryption for
              premium posts, and pull-payment withdrawals for shared revenue.
            </p>
          </StaggerItem>

          {/* CTA buttons */}
          <StaggerItem effect="fadeUp">
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/questions"
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-paper shadow-lg shadow-brand/25 transition hover:bg-brand-dim"
                >
                  Browse open questions
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/posts"
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-paper transition hover:border-brand/45 hover:bg-white/[0.06]"
                >
                  View posts
                </Link>
              </motion.div>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
