"use client";

/**
 * BountyPageBackground — canvas background for the Bounty Q&A page.
 *
 * Theme: on-chain escrow meets decentralised voting.
 * Color palette: purple (brand) + amber/gold (USDC bounty accent).
 *
 * Layers (back → front):
 *  1. Dark base
 *  2. Purple nebula — top-centre, breathing
 *  3. Amber blobs   — right + left, slow drift (USDC / bounty gold)
 *  4. Connection lines — purple & gold-tinted where gold nodes are involved
 *  5. Soft particles  — depth-of-field, purple + gold mix
 *  6. Main nodes      — ~18 % amber/gold, rest purple; inner cores on near nodes
 *  7. Cursor spotlight — purple, spring-smoothed
 *  8. Edge vignette
 *  9. Bottom fade      — clean transition into content
 */

import { useEffect, useRef } from "react";

// ─── Tuning ───────────────────────────────────────────────────────────────────
const NODE_COUNT = 44;
const PARTICLE_COUNT = 26;
const CONNECT_DIST = 155;
const SPEED = 0.13;
const GOLD_RATIO = 0.18; // fraction of gold (USDC-accent) nodes
const CURSOR_SPRING = 0.046;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Node {
  x: number; y: number;
  z: number; // 0 = far/dim, 1 = near/bright
  vx: number; vy: number; vz: number;
  pulse: number;
  gold: boolean;
}

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number;
  r: number; phase: number;
  gold: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rnd(lo: number, hi: number) { return lo + Math.random() * (hi - lo); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── Component ────────────────────────────────────────────────────────────────
export function BountyPageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Sizing ──────────────────────────────────────────────────────────────
    let W = 0, H = 0;
    function resize() {
      const p = canvas!.parentElement;
      W = p?.offsetWidth ?? window.innerWidth;
      H = p?.offsetHeight ?? 480;
      canvas!.width = W;
      canvas!.height = H;
    }
    resize();

    // ── Cursor ──────────────────────────────────────────────────────────────
    let tX = W * 0.5, tY = H * 0.35;
    let cX = tX, cY = tY;

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      if (lx >= -80 && lx <= rect.width + 80 && ly >= -80 && ly <= rect.height + 80) {
        tX = lx; tY = ly;
      } else {
        tX = W * 0.5; tY = H * 0.35;
      }
    }
    document.addEventListener("mousemove", onMouseMove, { passive: true });

    // ── Scene objects ────────────────────────────────────────────────────────
    const goldCount = Math.round(NODE_COUNT * GOLD_RATIO);

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: rnd(0, W), y: rnd(0, H),
      z: rnd(0.1, 1.0),
      vx: rnd(-SPEED, SPEED),
      vy: rnd(-SPEED * 0.7, SPEED * 0.7),
      vz: rnd(-0.0007, 0.0007),
      pulse: rnd(0, Math.PI * 2),
      gold: i < goldCount,
    }));

    const goldParticles = Math.round(PARTICLE_COUNT * 0.28);
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: rnd(0, W), y: rnd(0, H),
      z: Math.pow(Math.random(), 1.6),
      vx: rnd(-0.08, 0.08),
      vy: rnd(-0.05, 0.05),
      r: rnd(0.5, 1.9),
      phase: rnd(0, Math.PI * 2),
      gold: i < goldParticles,
    }));

    // ── Draw ─────────────────────────────────────────────────────────────────
    let frame = 0, animId = 0;

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      frame++;
      const t = frame * 0.0044;

      cX = lerp(cX, tX, CURSOR_SPRING);
      cY = lerp(cY, tY, CURSOR_SPRING);

      // 1. Dark base ──────────────────────────────────────────────────────────
      ctx!.fillStyle = "#08090f";
      ctx!.fillRect(0, 0, W, H);

      // 2. Purple nebula — top-centre, breathing ──────────────────────────────
      {
        const cx = W * 0.5 + Math.sin(t * 0.34) * W * 0.038;
        const cy = H * -0.06;
        const a  = 0.21 + Math.sin(t * 0.52) * 0.042;
        const g  = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.70);
        g.addColorStop(0, `rgba(124,58,237,${a})`);
        g.addColorStop(0.44, `rgba(91,33,182,${a * 0.42})`);
        g.addColorStop(1, "rgba(8,10,15,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 3a. Amber blob — right side ───────────────────────────────────────────
      {
        const cx = W * 0.84 + Math.cos(t * 0.27 + 1.0) * W * 0.042;
        const cy = H * 0.52 + Math.sin(t * 0.22 + 0.5) * H * 0.058;
        const a  = 0.105 + Math.sin(t * 0.38) * 0.026;
        const g  = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.30);
        g.addColorStop(0, `rgba(251,191,36,${a})`);
        g.addColorStop(1, "rgba(8,10,15,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 3b. Amber blob — left side ────────────────────────────────────────────
      {
        const cx = W * 0.14 + Math.sin(t * 0.31 + 2.0) * W * 0.032;
        const cy = H * 0.48 + Math.cos(t * 0.25 + 1.2) * H * 0.05;
        const a  = 0.072 + Math.cos(t * 0.44 + 0.8) * 0.018;
        const g  = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.23);
        g.addColorStop(0, `rgba(251,191,36,${a})`);
        g.addColorStop(1, "rgba(8,10,15,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 4. Connection lines ───────────────────────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= CONNECT_DIST) continue;

          const prox = 1 - dist / CONNECT_DIST;
          const avgZ = (a.z + b.z) * 0.5;
          const alpha = prox * prox * avgZ * 0.40;
          if (alpha < 0.008) continue;

          ctx!.lineWidth = lerp(0.18, 0.62, avgZ) * prox;
          if (a.gold || b.gold) {
            // Gold connection: warm amber tint
            ctx!.strokeStyle = `rgba(251,191,36,${alpha * 0.52})`;
          } else {
            const hue = lerp(252, 272, avgZ);
            ctx!.strokeStyle = `hsla(${hue},72%,60%,${alpha})`;
          }
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // 5. Particles ──────────────────────────────────────────────────────────
      for (const p of particles) {
        const pulse = Math.sin(t * 1.3 + p.phase) * 0.5 + 0.5;
        const alpha = lerp(0.055, 0.48, p.z) * lerp(0.72, 1, pulse);
        const r     = p.r * lerp(0.88, 1.12, pulse);

        ctx!.shadowBlur  = lerp(10, 1.5, p.z);
        ctx!.shadowColor = p.gold
          ? `rgba(251,191,36,${alpha})`
          : `rgba(167,139,250,${alpha})`;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(0.3, r), 0, Math.PI * 2);
        ctx!.fillStyle = p.gold
          ? `rgba(251,191,36,${alpha * 0.85})`
          : `rgba(${lerp(139,210,p.z)|0},${lerp(92,188,p.z)|0},${lerp(246,255,p.z)|0},${alpha})`;
        ctx!.fill();

        if (!reduced) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
          if (p.y < -6) p.y = H + 6; else if (p.y > H + 6) p.y = -6;
        }
      }

      // 6. Nodes ──────────────────────────────────────────────────────────────
      for (const n of nodes) {
        const pulse = Math.sin(t + n.pulse) * 0.5 + 0.5;
        const r     = lerp(1.0, 3.9, n.z) * lerp(0.92, 1.08, pulse);
        const alpha = lerp(0.18, 0.86, n.z) * lerp(0.88, 1, pulse);

        ctx!.shadowBlur  = lerp(4, 22, n.z) * lerp(0.75, 1.25, pulse);
        ctx!.shadowColor = n.gold
          ? `rgba(251,191,36,${alpha * 0.88})`
          : `hsla(268,80%,65%,${alpha * 0.82})`;

        const hue = lerp(252, 274, n.z);
        const sat = lerp(60, 82, n.z);
        const lum = lerp(45, 70, n.z);
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, Math.max(0.4, r), 0, Math.PI * 2);
        ctx!.fillStyle = n.gold
          ? `rgba(251,191,36,${alpha})`
          : `hsla(${hue},${sat}%,${lum}%,${alpha})`;
        ctx!.fill();

        // Inner core on near nodes
        if (n.z > 0.55) {
          const ca = lerp(0, 0.76, (n.z - 0.55) / 0.45) * lerp(0.82, 1, pulse);
          ctx!.shadowBlur  = lerp(0, 8, (n.z - 0.55) / 0.45);
          ctx!.shadowColor = n.gold ? "rgba(255,240,160,0.9)" : "rgba(235,220,255,0.9)";
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, Math.max(0.2, r * 0.32), 0, Math.PI * 2);
          ctx!.fillStyle = n.gold ? `rgba(255,240,160,${ca})` : `rgba(235,220,255,${ca})`;
          ctx!.fill();
        }

        if (!reduced) {
          n.x += n.vx; n.y += n.vy;
          n.z = Math.max(0.1, Math.min(1, n.z + n.vz));
          if (n.z <= 0.1 || n.z >= 1) n.vz *= -1;
          if (n.x < -22) n.x = W + 22; else if (n.x > W + 22) n.x = -22;
          if (n.y < -22) n.y = H + 22; else if (n.y > H + 22) n.y = -22;
        }
      }

      ctx!.shadowBlur = 0;

      // 7. Cursor spotlight ───────────────────────────────────────────────────
      {
        const spotR = Math.max(W, H) * 0.52;
        const g = ctx!.createRadialGradient(cX, cY, 0, cX, cY, spotR);
        g.addColorStop(0,    "rgba(148,103,255,0.12)");
        g.addColorStop(0.30, "rgba(124,58,237,0.055)");
        g.addColorStop(0.62, "rgba(91,33,182,0.022)");
        g.addColorStop(1,    "rgba(8,10,15,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 8. Edge vignette ──────────────────────────────────────────────────────
      {
        const g = ctx!.createRadialGradient(
          W * 0.5, H * 0.42, H * 0.20,
          W * 0.5, H * 0.42, Math.max(W, H) * 0.85,
        );
        g.addColorStop(0, "rgba(8,10,15,0)");
        g.addColorStop(1, "rgba(8,10,15,0.55)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 9. Bottom fade — blend seamlessly into page content ───────────────────
      {
        const g = ctx!.createLinearGradient(0, H * 0.58, 0, H);
        g.addColorStop(0, "rgba(10,12,16,0)");
        g.addColorStop(1, "rgba(10,12,16,1)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      if (!reduced) animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      resize();
      tX = W * 0.5; tY = H * 0.35;
      cX = tX; cY = tY;
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
