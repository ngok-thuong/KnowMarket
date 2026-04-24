"use client";

import { useEffect, useRef } from "react";

// ─── Tuning ────────────────────────────────────────────────────────────────────
const NODE_COUNT = 54;
const PARTICLE_COUNT = 32;
const MAX_CONNECT_DIST = 170;
const BASE_SPEED = 0.16; // px / frame — intentionally very slow

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Node {
  x: number;
  y: number;
  /** Perceived depth: 0 = far/small/dim, 1 = near/large/bright */
  z: number;
  vx: number;
  vy: number;
  /** Slowly drifts depth for parallax breathing */
  vz: number;
  /** Phase offset for individual pulse rhythm */
  pulse: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  r: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BlockchainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Sizing ──────────────────────────────────────────────────────────────
    let W = window.innerWidth;
    let H = window.innerHeight;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W;
      canvas!.height = H;
    }
    resize();

    // ── Node & particle initialisation ──────────────────────────────────────
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: rnd(0, W),
      y: rnd(0, H),
      z: rnd(0.08, 1.0),
      vx: rnd(-BASE_SPEED, BASE_SPEED),
      vy: rnd(-BASE_SPEED * 0.65, BASE_SPEED * 0.65),
      vz: rnd(-0.0007, 0.0007),
      pulse: rnd(0, Math.PI * 2),
    }));

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: rnd(0, W),
      y: rnd(0, H),
      z: rnd(0.04, 0.38),
      vx: rnd(-0.07, 0.07),
      vy: rnd(-0.05, 0.05),
      r: rnd(0.5, 1.6),
    }));

    // ── Draw loop ───────────────────────────────────────────────────────────
    let frame = 0;
    let animId = 0;

    function drawFrame() {
      ctx!.clearRect(0, 0, W, H);
      frame++;
      const t = frame * 0.006; // slow global time

      // ── 1. Connection lines ───────────────────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= MAX_CONNECT_DIST) continue;

          const proximity = 1 - dist / MAX_CONNECT_DIST;
          const avgZ = (a.z + b.z) * 0.5;
          const alpha = proximity * proximity * avgZ * 0.42;
          if (alpha < 0.008) continue;

          // Deep purple (far) → violet-lavender (near)
          const hue = lerp(252, 272, avgZ);
          const sat = lerp(55, 78, avgZ);
          const lum = lerp(42, 66, avgZ);

          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.strokeStyle = `hsla(${hue},${sat}%,${lum}%,${alpha})`;
          ctx!.lineWidth = lerp(0.18, 0.65, avgZ) * proximity;
          ctx!.stroke();
        }
      }

      // ── 2. Soft background particles (depth-of-field "bokeh") ────────────
      for (const p of particles) {
        const alpha = p.z * 0.35;
        const blur = lerp(6, 0, p.z); // far particles are blurrier
        ctx!.shadowBlur = blur + 4;
        ctx!.shadowColor = `rgba(167,139,250,${alpha * 1.2})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(196,181,253,${alpha})`;
        ctx!.fill();
      }

      // ── 3. Main nodes ─────────────────────────────────────────────────────
      for (const node of nodes) {
        const pulse = Math.sin(t + node.pulse) * 0.5 + 0.5; // 0–1
        const baseR = lerp(1.1, 4.2, node.z);
        const r = baseR * lerp(0.93, 1.07, pulse);
        const alpha = lerp(0.18, 0.88, node.z) * lerp(0.88, 1, pulse);

        // Depth-of-field: far nodes have soft halo, near nodes have crisp glow
        const dofBlur = lerp(12, 0, node.z); // blur radius for far nodes
        const glowSize = lerp(5, 26, node.z) * lerp(0.75, 1.25, pulse);

        // Outer soft halo (depth of field simulation)
        ctx!.shadowBlur = dofBlur + glowSize;
        ctx!.shadowColor = `hsla(268,80%,65%,${alpha * 0.7})`;

        const hue = lerp(252, 274, node.z);
        const sat = lerp(60, 82, node.z);
        const lum = lerp(45, 70, node.z);

        ctx!.beginPath();
        ctx!.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${hue},${sat}%,${lum}%,${alpha})`;
        ctx!.fill();

        // Bright inner core — only visible on near nodes
        if (node.z > 0.5) {
          const coreAlpha = lerp(0, 0.82, (node.z - 0.5) / 0.5) * lerp(0.85, 1, pulse);
          ctx!.shadowBlur = lerp(0, 12, (node.z - 0.5) / 0.5);
          ctx!.shadowColor = `rgba(230,215,255,${coreAlpha})`;
          ctx!.beginPath();
          ctx!.arc(node.x, node.y, r * 0.32, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(235,220,255,${coreAlpha})`;
          ctx!.fill();
        }
      }

      // Reset shadow so it doesn't bleed into other renderers
      ctx!.shadowBlur = 0;

      // ── 4. Position updates (skip if reduced motion) ─────────────────────
      if (!reduced) {
        for (const node of nodes) {
          node.x += node.vx;
          node.y += node.vy;
          node.z = Math.max(0.08, Math.min(1.0, node.z + node.vz));
          if (node.z <= 0.08 || node.z >= 1.0) node.vz *= -1;
          // Wrap at edges
          if (node.x < -24) node.x = W + 24;
          else if (node.x > W + 24) node.x = -24;
          if (node.y < -24) node.y = H + 24;
          else if (node.y > H + 24) node.y = -24;
        }
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -6) p.x = W + 6;
          else if (p.x > W + 6) p.x = -6;
          if (p.y < -6) p.y = H + 6;
          else if (p.y > H + 6) p.y = -6;
        }
        animId = requestAnimationFrame(drawFrame);
      }
      // if reduced motion: draw once, no rAF loop
    }

    animId = requestAnimationFrame(drawFrame);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}
