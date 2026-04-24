"use client";

import { motion } from "framer-motion";
import { Stagger, StaggerItem, FadeUp } from "@/components/home/motion-primitives";

const bullets = [
  "EVM + ERC-20 (e.g. USDC)",
  "Plaintext premium never on IPFS",
  "Pull withdrawals, no push loops",
] as const;

export function TrustStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-label="Trust and scope">
      <motion.div
        className="rounded-2xl border border-brand/25 bg-brand/5 px-6 py-8 sm:px-10"
        initial={{ opacity: 0, x: -32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <FadeUp>
            <div>
              <h2 className="text-lg font-semibold text-paper">AI stays out of payouts</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper/55">
                Models may rank answers or summarize threads for UX only. Winners, refunds, and
                revenue shares come from contracts and indexed events — never from an LLM decision.
              </p>
            </div>
          </FadeUp>

          <Stagger
            className="shrink-0 space-y-2 font-mono text-xs text-paper/45"
            staggerDelay={0.1}
          >
            {bullets.map((text) => (
              <StaggerItem key={text} effect="fadeIn">
                <li className="flex items-center gap-2 list-none">
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-brand-bright"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 480, damping: 18 }}
                    aria-hidden
                  />
                  {text}
                </li>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </motion.div>
    </section>
  );
}
