"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

type NodePoint = { x: number; y: number; r: number; vx: number; vy: number; tint: string };
type Spark = { x: number; y: number; vx: number; vy: number; r: number; life: number; maxLife: number; color: string };

const DARK_SPARKS = ["#fde047", "#fb923c", "#f43f5e", "#a78bfa", "#38bdf8", "#e0e7ff"];
const LIGHT_SPARKS = ["#6366f1", "#f97316", "#ec4899", "#0ea5e9", "#8b5cf6"];

export default function LandingMouseGlow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reducedMotion || !finePointer) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    let raf = 0;

    // Smoothed cursor position & intensity
    const target = { x: w * 0.5, y: h * 0.4, active: false };
    const cur = { x: w * 0.5, y: h * 0.4, alpha: 0 };
    let lastSparkX = 0;
    let lastSparkY = 0;

    let nodes: NodePoint[] = [];
    let sparks: Spark[] = [];

    const sparkPalette = isDark ? DARK_SPARKS : LIGHT_SPARKS;

    const seedNodes = () => {
      const count = Math.min(95, Math.max(48, Math.floor((w * h) / 19000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        tint: sparkPalette[Math.floor(Math.random() * sparkPalette.length)],
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      target.active = true;

      const dist = Math.hypot(e.clientX - lastSparkX, e.clientY - lastSparkY);
      if (dist > 22) {
        lastSparkX = e.clientX;
        lastSparkY = e.clientY;
        const count = dist > 60 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 0.25 + Math.random() * 0.7;
          sparks.push({
            x: e.clientX + (Math.random() - 0.5) * 14,
            y: e.clientY + (Math.random() - 0.5) * 14,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 0.25,
            r: 0.9 + Math.random() * 1.5,
            life: 0,
            maxLife: 34 + Math.random() * 26,
            color: sparkPalette[Math.floor(Math.random() * sparkPalette.length)],
          });
        }
        if (sparks.length > 55) sparks.splice(0, sparks.length - 55);
      }
    };

    const onLeave = () => {
      target.active = false;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Silky inertia interpolation
      cur.x += (target.x - cur.x) * 0.11;
      cur.y += (target.y - cur.y) * 0.11;
      cur.alpha += ((target.active ? 1 : 0) - cur.alpha) * 0.08;

      if (cur.alpha > 0.01) {
        // 1. Wide cosmic Phoenix-nebula bloom following mouse
        const outerR = 440;
        const outer = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, outerR);
        if (isDark) {
          outer.addColorStop(0, `rgba(251, 146, 60, ${0.14 * cur.alpha})`);
          outer.addColorStop(0.28, `rgba(139, 92, 246, ${0.13 * cur.alpha})`);
          outer.addColorStop(0.62, `rgba(56, 189, 248, ${0.06 * cur.alpha})`);
          outer.addColorStop(1, "rgba(56, 189, 248, 0)");
        } else {
          outer.addColorStop(0, `rgba(99, 102, 241, ${0.14 * cur.alpha})`);
          outer.addColorStop(0.32, `rgba(249, 115, 22, ${0.09 * cur.alpha})`);
          outer.addColorStop(0.66, `rgba(56, 189, 248, ${0.06 * cur.alpha})`);
          outer.addColorStop(1, "rgba(56, 189, 248, 0)");
        }
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, outerR, 0, Math.PI * 2);
        ctx.fill();

        // 2. Crisp inner starlight ring highlight
        const innerR = 135;
        const inner = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, innerR);
        if (isDark) {
          inner.addColorStop(0, `rgba(254, 240, 138, ${0.14 * cur.alpha})`);
          inner.addColorStop(0.55, `rgba(199, 210, 254, ${0.06 * cur.alpha})`);
          inner.addColorStop(1, "rgba(199, 210, 254, 0)");
        } else {
          inner.addColorStop(0, `rgba(129, 140, 248, ${0.14 * cur.alpha})`);
          inner.addColorStop(0.6, `rgba(251, 146, 60, ${0.05 * cur.alpha})`);
          inner.addColorStop(1, "rgba(251, 146, 60, 0)");
        }
        ctx.fillStyle = inner;
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, innerR, 0, Math.PI * 2);
        ctx.fill();

        // 3. Illuminated constellation mesh revealed near cursor
        const revealR = 230;
        const nearby: NodePoint[] = [];
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0) n.x = w;
          if (n.x > w) n.x = 0;
          if (n.y < 0) n.y = h;
          if (n.y > h) n.y = 0;

          const d = Math.hypot(n.x - cur.x, n.y - cur.y);
          if (d < revealR) {
            nearby.push(n);
            const strength = (1 - d / revealR) * cur.alpha;

            // Filament connecting star node to cursor
            ctx.strokeStyle = isDark
              ? `rgba(199, 210, 254, ${strength * 0.28})`
              : `rgba(99, 102, 241, ${strength * 0.24})`;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(cur.x, cur.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();

            // Lit star node with subtle glow
            ctx.globalAlpha = Math.min(1, strength * 0.95);
            ctx.fillStyle = n.tint;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r + strength * 1.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // Cross-connect nearby revealed stars for constellation geometry
        for (let i = 0; i < nearby.length; i++) {
          for (let j = i + 1; j < nearby.length; j++) {
            const d = Math.hypot(nearby[i].x - nearby[j].x, nearby[i].y - nearby[j].y);
            if (d < 115) {
              const midDist = Math.hypot((nearby[i].x + nearby[j].x) * 0.5 - cur.x, (nearby[i].y + nearby[j].y) * 0.5 - cur.y);
              const strength = Math.max(0, 1 - midDist / revealR) * (1 - d / 115) * cur.alpha;
              ctx.strokeStyle = isDark
                ? `rgba(251, 191, 36, ${strength * 0.26})`
                : `rgba(139, 92, 246, ${strength * 0.22})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(nearby[i].x, nearby[i].y);
              ctx.lineTo(nearby[j].x, nearby[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // 4. Fading Phoenix stardust sparks trail
      sparks = sparks.filter((s) => s.life < s.maxLife);
      for (const s of sparks) {
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;
        const fade = 1 - s.life / s.maxLife;
        ctx.globalAlpha = fade * (isDark ? 0.78 : 0.58);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * fade + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[2] h-full w-full select-none"
    />
  );
}
