"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

// ─── Shared viewport config ───────────────────────────────────────────────────
const VIEWPORT = { once: true, margin: "-80px" };

// ─── Shared prop type ────────────────────────────────────────────────────────
type DivProps = { children?: ReactNode; className?: string };

// ─── Variants ─────────────────────────────────────────────────────────────────
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const scalePopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 22 },
  },
};

// ─── Components ───────────────────────────────────────────────────────────────

/**
 * Fade + slide up from below, triggered when element enters the viewport.
 */
export function FadeUp({ children, className }: DivProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeUpVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Simple opacity fade-in, triggered when element enters the viewport.
 */
export function FadeIn({ children, className }: DivProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeInVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Spring pop-in scale entrance, triggered when element enters the viewport.
 */
export function ScalePop({ children, className }: DivProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={scalePopVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — wraps children so each StaggerItem inside animates in sequence.
 */
export function Stagger({
  children,
  className,
  staggerDelay = 0.12,
}: DivProps & { staggerDelay?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  const variants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay, delayChildren: 0.05 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * An individual child item for use inside <Stagger>.
 * Inherits stagger timing from the parent.
 */
export function StaggerItem({
  children,
  className,
  effect = "fadeUp",
}: DivProps & { effect?: "fadeUp" | "fadeIn" | "scalePop" }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  const map = {
    fadeUp: fadeUpVariants,
    fadeIn: fadeInVariants,
    scalePop: scalePopVariants,
  };

  return (
    <motion.div variants={map[effect]} className={className}>
      {children}
    </motion.div>
  );
}

// Re-export motion + hook for ad-hoc use in components
export { motion, useReducedMotion };
export { fadeUpVariants, fadeInVariants, scalePopVariants };
