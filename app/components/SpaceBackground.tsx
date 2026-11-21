"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  driftX: number;
  driftY: number;
  color: string;
  sparkle: boolean;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
  maxLife: number;
};

const DARK_COLORS = ["#f8fafc", "#e0e7ff", "#dbeafe", "#c7d2fe", "#fef3c7", "#ddd6fe"];
const LIGHT_COLORS = ["#6366f1", "#818cf8", "#38bdf8", "#a855f7", "#0ea5e9", "#4f46e5"];

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = window.innerWidth;
    let h = window.innerHeight;
    let raf = 0;

    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let nextMeteorAt = performance.now() + 2500 + Math.random() * 4000;

    const palette = isDark ? DARK_COLORS : LIGHT_COLORS;

    const seedStars = () => {
      const density = isDark ? 6800 : 12500;
      const count = Math.min(isDark ? 280 : 120, Math.max(isDark ? 130 : 55, Math.floor((w * h) / density)));
      stars = Array.from({ length: count }, () => {
        const tier = Math.random();
        const r = tier > 0.94 ? 1.55 + Math.random() * 0.85 : tier > 0.65 ? 0.9 + Math.random() * 0.55 : 0.45 + Math.random() * 0.45;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: isDark ? r : r * 1.15,
          baseAlpha: isDark
            ? (tier > 0.94 ? 0.72 + Math.random() * 0.28 : tier > 0.65 ? 0.4 + Math.random() * 0.35 : 0.18 + Math.random() * 0.28)
            : (tier > 0.9 ? 0.35 + Math.random() * 0.2 : 0.14 + Math.random() * 0.16),
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.4,
          driftX: (Math.random() - 0.5) * 0.035,
          driftY: -0.015 - Math.random() * 0.03,
          color: palette[Math.floor(Math.random() * palette.length)],
          sparkle: tier > 0.955,
        };
      });
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
      seedStars();
    };

    const spawnMeteor = () => {
      const fromRight = Math.random() > 0.35;
      const startX = fromRight ? w * (0.45 + Math.random() * 0.55) : w * (0.1 + Math.random() * 0.45);
      const startY = h * (0.04 + Math.random() * 0.32);
      const speed = 7 + Math.random() * 4.5;
      const angle = fromRight ? (145 + Math.random() * 18) * (Math.PI / 180) : (22 + Math.random() * 18) * (Math.PI / 180);
      meteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 75 + Math.random() * 65,
        life: 0,
        maxLife: 42 + Math.random() * 24,
      });
    };

    // --- Floating Celestial Bodies ---

    const drawSpiralGalaxy = (cx: number, cy: number, radius: number, t: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.42 + t * 0.018);
      ctx.scale(1, 0.44);

      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      if (isDark) {
        core.addColorStop(0, "rgba(224, 231, 255, 0.24)");
        core.addColorStop(0.28, "rgba(167, 139, 250, 0.14)");
        core.addColorStop(0.65, "rgba(56, 189, 248, 0.06)");
        core.addColorStop(1, "rgba(56, 189, 248, 0)");
      } else {
        core.addColorStop(0, "rgba(99, 102, 241, 0.16)");
        core.addColorStop(0.4, "rgba(168, 85, 247, 0.09)");
        core.addColorStop(1, "rgba(168, 85, 247, 0)");
      }
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Two spiral arms made of delicate star clusters
      for (let arm = 0; arm < 2; arm++) {
        const armOffset = arm * Math.PI;
        for (let i = 1; i <= 26; i++) {
          const frac = i / 26;
          const angle = armOffset + frac * 4.4;
          const dist = frac * radius * 0.92;
          const px = Math.cos(angle) * dist;
          const py = Math.sin(angle) * dist;
          ctx.fillStyle = isDark
            ? `rgba(199, 210, 254, ${(1 - frac) * 0.32})`
            : `rgba(99, 102, 241, ${(1 - frac) * 0.22})`;
          ctx.beginPath();
          ctx.arc(px, py, (1 - frac) * 1.9 + 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const drawBlackHole = (cx: number, cy: number, r: number, t: number) => {
      ctx.save();
      ctx.translate(cx, cy);

      // Outer gravitational lensing aura
      const aura = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, r * 3.8);
      if (isDark) {
        aura.addColorStop(0, "rgba(251, 146, 60, 0.22)");
        aura.addColorStop(0.28, "rgba(244, 63, 94, 0.14)");
        aura.addColorStop(0.58, "rgba(139, 92, 246, 0.08)");
        aura.addColorStop(1, "rgba(139, 92, 246, 0)");
      } else {
        aura.addColorStop(0, "rgba(249, 115, 22, 0.14)");
        aura.addColorStop(0.35, "rgba(139, 92, 246, 0.10)");
        aura.addColorStop(1, "rgba(139, 92, 246, 0)");
      }
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 3.8, 0, Math.PI * 2);
      ctx.fill();

      const tilt = -0.34;
      const diskRx = r * 2.75;
      const diskRy = r * 0.62;
      const pulse = 0.88 + 0.12 * Math.sin(t * 1.1);

      // Back half of accretion disk (behind event horizon)
      ctx.save();
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.ellipse(0, 0, diskRx, diskRy, 0, Math.PI, Math.PI * 2);
      const backGrad = ctx.createLinearGradient(-diskRx, 0, diskRx, 0);
      backGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
      backGrad.addColorStop(0.22, `rgba(244, 63, 94, ${(isDark ? 0.34 : 0.2) * pulse})`);
      backGrad.addColorStop(0.5, `rgba(253, 224, 71, ${(isDark ? 0.55 : 0.32) * pulse})`);
      backGrad.addColorStop(0.78, `rgba(251, 146, 60, ${(isDark ? 0.34 : 0.2) * pulse})`);
      backGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.strokeStyle = backGrad;
      ctx.lineWidth = r * 0.36;
      ctx.stroke();

      // Secondary lensed upper light arc (Einstein ring illusion)
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, Math.PI * 1.08, Math.PI * 1.92);
      ctx.strokeStyle = isDark ? `rgba(254, 240, 138, ${0.38 * pulse})` : `rgba(249, 115, 22, ${0.22 * pulse})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // Event horizon dark core
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "#02030a" : "#1e1b4b";
      ctx.fill();

      // Crisp inner photon ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.03, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? `rgba(251, 191, 36, ${0.58 * pulse})` : `rgba(249, 115, 22, ${0.36 * pulse})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Front half of accretion disk (passing in front of event horizon)
      ctx.save();
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.ellipse(0, 0, diskRx, diskRy, 0, 0, Math.PI);
      const frontGrad = ctx.createLinearGradient(-diskRx, 0, diskRx, 0);
      frontGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
      frontGrad.addColorStop(0.2, `rgba(251, 146, 60, ${(isDark ? 0.42 : 0.24) * pulse})`);
      frontGrad.addColorStop(0.5, `rgba(254, 249, 195, ${(isDark ? 0.72 : 0.42) * pulse})`);
      frontGrad.addColorStop(0.8, `rgba(244, 63, 94, ${(isDark ? 0.42 : 0.24) * pulse})`);
      frontGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.strokeStyle = frontGrad;
      ctx.lineWidth = r * 0.28;
      ctx.stroke();

      // Orbiting bright plasma speck along the disk
      const speckAngle = t * 0.55;
      const sx = Math.cos(speckAngle) * diskRx * 0.86;
      const sy = Math.sin(speckAngle) * diskRy * 0.86;
      if (Math.sin(speckAngle) >= 0) {
        ctx.fillStyle = isDark ? "rgba(255, 251, 235, 0.85)" : "rgba(249, 115, 22, 0.55)";
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();
    };

    const drawRingedPlanet = (cx: number, cy: number, r: number, t: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      const tilt = 0.36;

      // Soft atmospheric halo
      const halo = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2.4);
      if (isDark) {
        halo.addColorStop(0, "rgba(99, 102, 241, 0.18)");
        halo.addColorStop(0.5, "rgba(56, 189, 248, 0.08)");
        halo.addColorStop(1, "rgba(56, 189, 248, 0)");
      } else {
        halo.addColorStop(0, "rgba(99, 102, 241, 0.14)");
        halo.addColorStop(1, "rgba(99, 102, 241, 0)");
      }
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Back half of planetary rings
      ctx.save();
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 2.25, r * 0.56, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = isDark ? "rgba(199, 210, 254, 0.22)" : "rgba(99, 102, 241, 0.20)";
      ctx.lineWidth = r * 0.24;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.78, r * 0.42, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.20)" : "rgba(14, 165, 233, 0.18)";
      ctx.lineWidth = r * 0.1;
      ctx.stroke();
      ctx.restore();

      // Shaded gas giant sphere
      const bodyGrad = ctx.createRadialGradient(-r * 0.38, -r * 0.38, r * 0.1, 0, 0, r);
      if (isDark) {
        bodyGrad.addColorStop(0, "rgba(165, 180, 252, 0.72)");
        bodyGrad.addColorStop(0.38, "rgba(79, 70, 229, 0.62)");
        bodyGrad.addColorStop(0.78, "rgba(30, 27, 75, 0.85)");
        bodyGrad.addColorStop(1, "rgba(8, 11, 28, 0.94)");
      } else {
        bodyGrad.addColorStop(0, "rgba(224, 231, 255, 0.95)");
        bodyGrad.addColorStop(0.45, "rgba(129, 140, 248, 0.58)");
        bodyGrad.addColorStop(1, "rgba(79, 70, 229, 0.42)");
      }
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Subtle atmospheric bands clipped to sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.rotate(tilt);
      ctx.fillStyle = isDark ? "rgba(125, 211, 252, 0.10)" : "rgba(255, 255, 255, 0.24)";
      ctx.fillRect(-r * 1.2, -r * 0.35, r * 2.4, r * 0.18);
      ctx.fillStyle = isDark ? "rgba(196, 181, 253, 0.08)" : "rgba(99, 102, 241, 0.12)";
      ctx.fillRect(-r * 1.2, r * 0.08, r * 2.4, r * 0.2);
      ctx.restore();

      // Front half of planetary rings
      ctx.save();
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 2.25, r * 0.56, 0, 0, Math.PI);
      ctx.strokeStyle = isDark ? "rgba(224, 231, 255, 0.32)" : "rgba(99, 102, 241, 0.28)";
      ctx.lineWidth = r * 0.24;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.78, r * 0.42, 0, 0, Math.PI);
      ctx.strokeStyle = isDark ? "rgba(125, 211, 252, 0.32)" : "rgba(14, 165, 233, 0.24)";
      ctx.lineWidth = r * 0.1;
      ctx.stroke();

      // Tiny orbiting moon on outer ring path
      const ma = t * 0.28 + 1.2;
      const mx = Math.cos(ma) * r * 2.55;
      const my = Math.sin(ma) * r * 0.7;
      ctx.fillStyle = isDark ? "rgba(224, 231, 255, 0.72)" : "rgba(79, 70, 229, 0.52)";
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(2, r * 0.09), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    const drawCrescentExoplanet = (cx: number, cy: number, r: number, t: number) => {
      ctx.save();
      ctx.translate(cx, cy);

      // Orbit ring around exoplanet
      ctx.save();
      ctx.rotate(-0.45);
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = isDark ? "rgba(199, 210, 254, 0.14)" : "rgba(99, 102, 241, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 2.1, r * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbiting satellite moonlet
      const satA = t * 0.42;
      ctx.fillStyle = isDark ? "rgba(253, 224, 71, 0.65)" : "rgba(14, 165, 233, 0.55)";
      ctx.beginPath();
      ctx.arc(Math.cos(satA) * r * 2.1, Math.sin(satA) * r * 0.85, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Main planet body
      const grad = ctx.createRadialGradient(-r * 0.45, -r * 0.4, r * 0.08, 0, 0, r);
      if (isDark) {
        grad.addColorStop(0, "rgba(103, 232, 249, 0.68)");
        grad.addColorStop(0.35, "rgba(56, 189, 248, 0.35)");
        grad.addColorStop(0.75, "rgba(15, 23, 42, 0.88)");
        grad.addColorStop(1, "rgba(4, 6, 15, 0.95)");
      } else {
        grad.addColorStop(0, "rgba(186, 230, 253, 0.92)");
        grad.addColorStop(0.5, "rgba(56, 189, 248, 0.45)");
        grad.addColorStop(1, "rgba(99, 102, 241, 0.28)");
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Lit crescent rim highlight
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.85, Math.PI * 1.65);
      ctx.strokeStyle = isDark ? "rgba(165, 243, 252, 0.5)" : "rgba(14, 165, 233, 0.4)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    };

    const drawFrame = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = reducedMotion ? 0 : now * 0.001;

      // Subtle constellation filaments in light mode between close stars
      if (!isDark) {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = dx * dx + dy * dy;
            if (dist < 14000) {
              const a = (1 - dist / 14000) * 0.08;
              ctx.strokeStyle = `rgba(99, 102, 241, ${a})`;
              ctx.beginPath();
              ctx.moveTo(stars[i].x, stars[i].y);
              ctx.lineTo(stars[j].x, stars[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw starfield
      for (const s of stars) {
        if (!reducedMotion) {
          s.x += s.driftX;
          s.y += s.driftY;
          if (s.x < -4) s.x = w + 4;
          if (s.x > w + 4) s.x = -4;
          if (s.y < -4) s.y = h + 4;
          if (s.y > h + 4) s.y = -4;
        }
        const twinkle = reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(t * s.speed + s.phase);
        const alpha = s.baseAlpha * twinkle;

        if (s.sparkle && isDark) {
          const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5.2);
          halo.addColorStop(0, `rgba(199, 210, 254, ${alpha * 0.5})`);
          halo.addColorStop(1, "rgba(199, 210, 254, 0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 5.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(224, 231, 255, ${alpha * 0.45})`;
          ctx.lineWidth = 0.7;
          const arm = s.r * 3.4;
          ctx.beginPath();
          ctx.moveTo(s.x - arm, s.y);
          ctx.lineTo(s.x + arm, s.y);
          ctx.moveTo(s.x, s.y - arm);
          ctx.lineTo(s.x, s.y + arm);
          ctx.stroke();
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw floating cosmic elements (scaled gracefully to viewport)
      const scale = Math.min(1.15, Math.max(0.65, w / 1440));

      // 1. Distant spiral galaxy (lower-right expanse)
      drawSpiralGalaxy(
        w * 0.82 + Math.sin(t * 0.14) * 14,
        h * 0.8 + Math.cos(t * 0.12) * 10,
        84 * scale,
        t
      );

      // 2. Glowing Black Hole with tilted accretion disk (upper-right sky)
      drawBlackHole(
        w * 0.87 + Math.cos(t * 0.22) * 12,
        h * 0.24 + Math.sin(t * 0.28) * 14,
        28 * scale,
        t
      );

      // 3. Ringed Gas Giant Planet (lower-left sky)
      drawRingedPlanet(
        w * 0.11 + Math.sin(t * 0.19) * 14,
        h * 0.74 + Math.cos(t * 0.24) * 16,
        34 * scale,
        t
      );

      // 4. Crescent Ice Exoplanet + orbiting moonlet (upper-left sky)
      drawCrescentExoplanet(
        w * 0.15 + Math.cos(t * 0.25) * 10,
        h * 0.2 + Math.sin(t * 0.31) * 12,
        18 * scale,
        t
      );

      // Draw shooting stars (dark mode)
      if (!reducedMotion && isDark) {
        if (now >= nextMeteorAt) {
          spawnMeteor();
          nextMeteorAt = now + 5500 + Math.random() * 8000;
        }
        meteors = meteors.filter((m) => m.life < m.maxLife);
        for (const m of meteors) {
          m.x += m.vx;
          m.y += m.vy;
          m.life += 1;
          const progress = m.life / m.maxLife;
          const fade = Math.sin(progress * Math.PI);
          const mag = Math.hypot(m.vx, m.vy) || 1;
          const tailX = m.x - (m.vx / mag) * m.len;
          const tailY = m.y - (m.vy / mag) * m.len;

          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `rgba(224, 231, 255, ${0.85 * fade})`);
          grad.addColorStop(0.35, `rgba(139, 140, 255, ${0.4 * fade})`);
          grad.addColorStop(1, "rgba(139, 140, 255, 0)");

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * fade})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reducedMotion) {
        raf = requestAnimationFrame(drawFrame);
      }
    };

    resize();
    if (reducedMotion) drawFrame(0);
    else raf = requestAnimationFrame(drawFrame);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none transition-colors duration-500">
      {/* Deep cosmos (dark) / Luminous celestial sky (light) */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isDark
            ? "radial-gradient(1100px 650px at 14% -8%, rgba(99, 102, 241, 0.22), transparent 62%)," +
              "radial-gradient(900px 560px at 92% 8%, rgba(56, 189, 248, 0.13), transparent 58%)," +
              "radial-gradient(850px 540px at 8% 92%, rgba(168, 85, 247, 0.14), transparent 60%)," +
              "radial-gradient(700px 480px at 84% 94%, rgba(52, 211, 153, 0.08), transparent 60%)," +
              "linear-gradient(180deg, #03050d 0%, #070b1a 52%, #040712 100%)"
            : "radial-gradient(1100px 650px at 12% -6%, rgba(99, 102, 241, 0.14), transparent 60%)," +
              "radial-gradient(900px 560px at 92% 6%, rgba(56, 189, 248, 0.14), transparent 58%)," +
              "radial-gradient(850px 540px at 10% 92%, rgba(168, 85, 247, 0.10), transparent 60%)," +
              "radial-gradient(700px 480px at 88% 90%, rgba(16, 185, 129, 0.08), transparent 60%)," +
              "linear-gradient(180deg, #f5f7ff 0%, #eef2ff 52%, #f8faff 100%)",
        }}
      />
      <div className={`nebula-orb -left-24 top-16 h-[28rem] w-[28rem] ${isDark ? "bg-indigo-500/15" : "bg-indigo-400/15"}`} />
      <div className={`nebula-orb right-[-6rem] top-1/3 h-[26rem] w-[26rem] [animation-delay:-7s] ${isDark ? "bg-cyan-500/10" : "bg-sky-400/15"}`} />
      <div className={`nebula-orb bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] [animation-delay:-13s] ${isDark ? "bg-fuchsia-500/10" : "bg-violet-400/12"}`} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
