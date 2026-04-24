"use client";

/**
 * PostsPageBackground — canvas background for the Knowledge Posts feed.
 *
 * Theme: knowledge library — encrypted premium content + free previews.
 * Three-color palette matching the page's own badges and accents:
 *   • Amber / gold  — premium posts (paywall, XChaCha20, on-chain access)
 *   • Teal / cyan   — free posts (open preview, community knowledge)
 *   • Purple        — brand / smart-contract infrastructure
 *
 * Layers (back → front):
 *  1. Dark base
 *  2. Amber nebula    — top-left, breathing
 *  3. Teal nebula     — top-right, breathing
 *  4. Purple nebula   — bottom-centre, slow drift
 *  5. Connection lines — color-tinted by node type
 *  6. Soft particles  — amber / teal / purple mix, depth-of-field
 *  7. Main nodes      — same three-color mix, inner cores on near nodes
 *  8. Cursor spotlight — warm amber tint (matches page header)
 *  9. Edge vignette + bottom fade
 */

import { useEffect, useRef } from "react";

// ─── Tuning ───────────────────────────────────────────────────────────────────
const NODE_COUNT      = 46;
const PARTICLE_COUNT  = 28;
const CONNECT_DIST    = 150;
const SPEED           = 0.12;
/** Share of each node type (must sum to 1) */
const AMBER_RATIO  = 0.38;
const TEAL_RATIO   = 0.30;
// remainder → purple
const CURSOR_SPRING = 0.046;

// ─── Colour helpers ───────────────────────────────────────────────────────────
type NodeKind = "amber" | "teal" | "purple";

function nodeColor(kind: NodeKind, z: number, alpha: number): string {
  switch (kind) {
    case "amber":
      return `rgba(251,${Math.round(lerp(160, 200, z))},36,${alpha})`;
    case "teal":
      return `rgba(${Math.round(lerp(20, 80, z))},${Math.round(lerp(200, 220, z))},${Math.round(lerp(180, 200, z))},${alpha})`;
    case "purple":
    default: {
      const h = lerp(252, 274, z);
      const s = lerp(60, 82, z);
      const l = lerp(45, 70, z);
      return `hsla(${h},${s}%,${l}%,${alpha})`;
    }
  }
}

function nodeShadow(kind: NodeKind, alpha: number): string {
  switch (kind) {
    case "amber":  return `rgba(251,191,36,${alpha * 0.88})`;
    case "teal":   return `rgba(45,212,191,${alpha * 0.88})`;
    case "purple":
    default:       return `hsla(268,80%,65%,${alpha * 0.82})`;
  }
}

function coreColor(kind: NodeKind, alpha: number): string {
  switch (kind) {
    case "amber":  return `rgba(255,240,160,${alpha})`;
    case "teal":   return `rgba(180,255,245,${alpha})`;
    case "purple":
    default:       return `rgba(235,220,255,${alpha})`;
  }
}

function lineColor(ka: NodeKind, kb: NodeKind, alpha: number): string {
  if (ka === "amber" || kb === "amber") return `rgba(251,191,36,${alpha * 0.50})`;
  if (ka === "teal"  || kb === "teal")  return `rgba(45,212,191,${alpha * 0.45})`;
  return `hsla(264,72%,60%,${alpha})`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Node {
  x: number; y: number;
  z: number;
  vx: number; vy: number; vz: number;
  pulse: number;
  kind: NodeKind;
}

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number;
  r: number; phase: number;
  kind: NodeKind;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rnd(lo: number, hi: number) { return lo + Math.random() * (hi - lo); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function pickKind(i: number, total: number): NodeKind {
  const f = i / total;
  if (f < AMBER_RATIO) return "amber";
  if (f < AMBER_RATIO + TEAL_RATIO) return "teal";
  return "purple";
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PostsPageBackground() {
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
      canvas!.width  = W;
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
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: rnd(0, W), y: rnd(0, H),
      z: rnd(0.1, 1.0),
      vx: rnd(-SPEED, SPEED),
      vy: rnd(-SPEED * 0.65, SPEED * 0.65),
      vz: rnd(-0.0007, 0.0007),
      pulse: rnd(0, Math.PI * 2),
      kind: pickKind(i, NODE_COUNT),
    }));

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: rnd(0, W), y: rnd(0, H),
      z: Math.pow(Math.random(), 1.6),
      vx: rnd(-0.08, 0.08),
      vy: rnd(-0.05, 0.05),
      r: rnd(0.5, 1.9),
      phase: rnd(0, Math.PI * 2),
      kind: pickKind(i, PARTICLE_COUNT),
    }));

    // ── Draw loop ────────────────────────────────────────────────────────────
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

      // 2. Amber nebula — top-left ────────────────────────────────────────────
      {
        const cx = W * 0.18 + Math.sin(t * 0.32 + 0.8) * W * 0.05;
        const cy = H * -0.04;
        const a  = 0.19 + Math.sin(t * 0.48) * 0.042;
        const g  = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.58);
        g.addColorStop(0, `rgba(251,191,36,${a})`);
        g.addColorStop(0.40, `rgba(180,120,20,${a * 0.38})`);
        g.addColorStop(1, "rgba(8,10,15,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 3. Teal nebula — top-right ────────────────────────────────────────────
      {
        const cx = W * 0.82 + Math.cos(t * 0.28 + 1.5) * W * 0.045;
        const cy = H * -0.02;
        const a  = 0.14 + Math.cos(t * 0.42 + 0.5) * 0.032;
        const g  = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.52);
        g.addColorStop(0, `rgba(45,212,191,${a})`);
        g.addColorStop(0.42, `rgba(20,160,145,${a * 0.40})`);
        g.addColorStop(1, "rgba(8,10,15,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 4. Purple nebula — bottom-centre (subtle depth anchor) ────────────────
      {
        const cx = W * 0.50 + Math.sin(t * 0.24 + 2.0) * W * 0.04;
        const cy = H * 1.05;
        const a  = 0.16 + Math.sin(t * 0.38 + 1.0) * 0.035;
        const g  = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.60);
        g.addColorStop(0, `rgba(124,58,237,${a})`);
        g.addColorStop(0.45, `rgba(91,33,182,${a * 0.38})`);
        g.addColorStop(1, "rgba(8,10,15,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 5. Connection lines ───────────────────────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= CONNECT_DIST) continue;

          const prox  = 1 - dist / CONNECT_DIST;
          const avgZ  = (a.z + b.z) * 0.5;
          const alpha = prox * prox * avgZ * 0.38;
          if (alpha < 0.008) continue;

          ctx!.lineWidth   = lerp(0.18, 0.60, avgZ) * prox;
          ctx!.strokeStyle = lineColor(a.kind, b.kind, alpha);
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // 6. Particles ──────────────────────────────────────────────────────────
      for (const p of particles) {
        const pulse = Math.sin(t * 1.3 + p.phase) * 0.5 + 0.5;
        const alpha = lerp(0.055, 0.46, p.z) * lerp(0.72, 1, pulse);
        const r     = Math.max(0.3, p.r * lerp(0.88, 1.12, pulse));

        ctx!.shadowBlur  = lerp(10, 1.5, p.z);
        ctx!.shadowColor = nodeShadow(p.kind, alpha);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = nodeColor(p.kind, p.z, alpha * 0.85);
        ctx!.fill();

        if (!reduced) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
          if (p.y < -6) p.y = H + 6; else if (p.y > H + 6) p.y = -6;
        }
      }

      // 7. Nodes ──────────────────────────────────────────────────────────────
      for (const n of nodes) {
        const pulse = Math.sin(t + n.pulse) * 0.5 + 0.5;
        const r     = Math.max(0.4, lerp(1.0, 3.9, n.z) * lerp(0.92, 1.08, pulse));
        const alpha = lerp(0.18, 0.86, n.z) * lerp(0.88, 1, pulse);

        ctx!.shadowBlur  = lerp(4, 22, n.z) * lerp(0.75, 1.25, pulse);
        ctx!.shadowColor = nodeShadow(n.kind, alpha);
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = nodeColor(n.kind, n.z, alpha);
        ctx!.fill();

        // Bright inner core on near nodes
        if (n.z > 0.55) {
          const ca = lerp(0, 0.76, (n.z - 0.55) / 0.45) * lerp(0.82, 1, pulse);
          ctx!.shadowBlur  = lerp(0, 8, (n.z - 0.55) / 0.45);
          ctx!.shadowColor = coreColor(n.kind, 0.9);
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, Math.max(0.2, r * 0.32), 0, Math.PI * 2);
          ctx!.fillStyle = coreColor(n.kind, ca);
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

      // 8. Cursor spotlight — warm amber tint (matches page header) ───────────
      {
        const spotR = Math.max(W, H) * 0.52;
        const g = ctx!.createRadialGradient(cX, cY, 0, cX, cY, spotR);
        g.addColorStop(0,    "rgba(251,191,36,0.10)");
        g.addColorStop(0.25, "rgba(200,140,20,0.05)");
        g.addColorStop(0.55, "rgba(124,58,237,0.025)");
        g.addColorStop(1,    "rgba(8,10,15,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // 9. Edge vignette ──────────────────────────────────────────────────────
      {
        const g = ctx!.createRadialGradient(
          W * 0.5, H * 0.42, H * 0.20,
          W * 0.5, H * 0.42, Math.max(W, H) * 0.85,
        );
        g.addColorStop(0, "rgba(8,10,15,0)");
        g.addColorStop(1, "rgba(8,10,15,0.52)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      }

      // Bottom fade ────────────────────────────────────────────────────────────
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
