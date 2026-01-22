"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  v: number;
  a: number;
  layer: 1 | 2;
  tw: number;
};

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let t = 0;

    const stars: Star[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // stars: 2 layers for depth
      stars.length = 0;
      const countFar = Math.min(220, Math.floor((w * h) / 12000));
      const countNear = Math.min(140, Math.floor((w * h) / 18000));

      const mk = (layer: 1 | 2, n: number) => {
        for (let i = 0; i < n; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: layer === 1 ? 0.45 + Math.random() * 1.1 : 0.7 + Math.random() * 1.6,
            v: layer === 1 ? 0.02 + Math.random() * 0.08 : 0.06 + Math.random() * 0.18,
            a: layer === 1 ? 0.10 + Math.random() * 0.28 : 0.12 + Math.random() * 0.38,
            layer,
            tw: layer === 1 ? 0.002 + Math.random() * 0.007 : 0.003 + Math.random() * 0.012,
          });
        }
      };

      mk(1, countFar);
      mk(2, countNear);
    };

    const drawNebula = () => {
      // Animated, layered soft gradients (no hard circles)
      // t drives slow motion; values chosen to be subtle.
      const p1x = w * (0.25 + 0.06 * Math.sin(t * 0.00035));
      const p1y = h * (0.28 + 0.05 * Math.cos(t * 0.00028));
      const p2x = w * (0.70 + 0.07 * Math.cos(t * 0.00031));
      const p2y = h * (0.68 + 0.06 * Math.sin(t * 0.00024));
      const p3x = w * (0.52 + 0.05 * Math.sin(t * 0.00022));
      const p3y = h * (0.42 + 0.05 * Math.cos(t * 0.00019));

      // very soft “cloud” alpha; keep low to avoid looking like stripes
      const a1 = 0.045 + 0.012 * (0.5 + 0.5 * Math.sin(t * 0.00025));
      const a2 = 0.030 + 0.010 * (0.5 + 0.5 * Math.cos(t * 0.00021));
      const a3 = 0.022 + 0.008 * (0.5 + 0.5 * Math.sin(t * 0.00018));

      // Layer 1: cool blue haze
      const g1 = ctx.createRadialGradient(p1x, p1y, 60, p1x, p1y, Math.max(w, h) * 0.95);
      g1.addColorStop(0, `rgba(120,170,255,${a1})`);
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Layer 2: violet-ish haze
      const g2 = ctx.createRadialGradient(p2x, p2y, 80, p2x, p2y, Math.max(w, h) * 1.05);
      g2.addColorStop(0, `rgba(185,120,255,${a2})`);
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Layer 3: warm faint glow (gives cinematic depth)
      const g3 = ctx.createRadialGradient(p3x, p3y, 90, p3x, p3y, Math.max(w, h) * 1.1);
      g3.addColorStop(0, `rgba(255,200,140,${a3})`);
      g3.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);
    };

    const tick = () => {
      t += 16;

      ctx.clearRect(0, 0, w, h);

      // nebula behind stars
      drawNebula();

      // stars
      for (const s of stars) {
        s.y += s.v * (s.layer === 2 ? 1.0 : 0.7);
        if (s.y > h + 10) {
          s.y = -10;
          s.x = Math.random() * w;
        }

        // tiny twinkle
        s.a += (Math.random() - 0.5) * s.tw;
        s.a = Math.max(0.06, Math.min(0.55, s.a));

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" aria-hidden />;
}
