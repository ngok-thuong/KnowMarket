"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FadeUp, Stagger, StaggerItem } from "@/components/home/motion-primitives";

const steps = [
  {
    step: "01",
    title: "Connect & sign",
    body: "Use your wallet for on-chain actions and EIP-191 signed sessions for the API when auth is enabled.",
  },
  {
    step: "02",
    title: "Create or participate",
    body: "Post a bounty question, answer and vote, publish or buy premium content, or submit a contribution receipt.",
  },
  {
    step: "03",
    title: "Wait for confirmations",
    body: "The UI follows pending → indexer confirmed states. Payouts and access follow contract rules, not manual approval.",
  },
] as const;

export function HowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section className="border-y border-white/5 bg-ink/55 backdrop-blur-[2px]" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <FadeUp>
          <h2 id="how-heading" className="text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
            How it feels in the app
          </h2>
          <p className="mt-3 max-w-2xl text-paper/55">
            Every write path follows the same pending pattern: approve tokens if needed, broadcast
            the transaction, then let the indexer move the row to confirmed.
          </p>
        </FadeUp>

        {/* Connector line — draws across when section enters viewport */}
        {!reduced && (
          <div className="relative mt-12 hidden sm:block" aria-hidden>
            <svg
              className="absolute top-3 left-0 w-full"
              height="2"
              viewBox="0 0 100 2"
              preserveAspectRatio="none"
            >
              <motion.line
                x1="6" y1="1" x2="94" y2="1"
                stroke="rgba(124,58,237,0.25)"
                strokeWidth="1"
                strokeDasharray="1"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.9, ease: "easeInOut", delay: 0.3 }}
              />
            </svg>
          </div>
        )}

        <Stagger className="mt-12 grid gap-10 sm:grid-cols-3" staggerDelay={0.18}>
          {steps.map((s) => (
            <StaggerItem key={s.step} effect="fadeUp">
              <li className="list-none">
                {/* Step number circle with spring pop */}
                <motion.span
                  className="inline-block font-mono text-xs text-brand-bright/90"
                  initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                  whileInView={reduced ? {} : { scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                >
                  {s.step}
                </motion.span>
                <h3 className="mt-2 text-lg font-medium text-paper">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/50">{s.body}</p>
              </li>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
