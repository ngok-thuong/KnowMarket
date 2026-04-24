"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeUp, Stagger, StaggerItem } from "@/components/home/motion-primitives";

const links = [
  {
    href: "/questions",
    label: "Explore Bounty Q&A",
    variant: "primary",
  },
  {
    href: "/posts",
    label: "Browse posts",
    variant: "secondary",
  },
  {
    href: "/contribute",
    label: "Contribute receipts",
    variant: "ghost",
  },
  {
    href: "/learn",
    label: "Read the deep-dive explainer →",
    variant: "link",
  },
] as const;

type Variant = "primary" | "secondary" | "ghost" | "link";

const variantClass: Record<Variant, string> = {
  primary:
    "inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-paper shadow-lg shadow-brand/25 transition hover:bg-brand-dim",
  secondary:
    "inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-paper transition hover:border-brand/45 hover:bg-white/[0.06]",
  ghost:
    "inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.02] px-6 py-3 text-sm font-medium text-paper/85 transition hover:border-brand/35 hover:bg-white/[0.05] hover:text-paper",
  link: "mt-1 inline-flex items-center justify-center text-sm font-medium text-brand-bright/90 transition hover:text-paper",
};

export function FinalCTA() {
  return (
    <section className="border-t border-white/5 bg-ink/45 backdrop-blur-[2px]" aria-label="Get started">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-white/[0.08] bg-ink/50 p-8 sm:flex-row sm:items-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <FadeUp className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-bright/90">
              Get started
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Choose a loop and ship value on-chain
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-paper/55 sm:text-base">
              Ask with a USDC bounty, publish a premium post with client-side encryption, or submit
              an IPFS receipt for a revenue split — contracts hold funds, the indexer keeps feeds
              fast.
            </p>
          </FadeUp>

          <Stagger
            className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[15rem]"
            staggerDelay={0.1}
          >
            {links.map((l) => (
              <StaggerItem key={l.href} effect="fadeUp">
                <motion.div
                  whileHover={l.variant !== "link" ? { scale: 1.02 } : {}}
                  whileTap={l.variant !== "link" ? { scale: 0.98 } : {}}
                >
                  <Link href={l.href} className={variantClass[l.variant]}>
                    {l.label}
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </motion.div>
      </div>
    </section>
  );
}
