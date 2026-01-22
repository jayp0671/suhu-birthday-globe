"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { STOPS } from "../lib/stops";
import Starfield from "../components/Starfield";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type Mode = "GLOBE" | "CELEBRATE";

const HOME_ALT = 2.25;
const MID_ALT = 1.6;
const CLOSE_ALT = 0.86;

// “north-up” camera: equator view
const POLAR_EQUATOR = Math.PI / 2;

export default function GlobeScene({
  mode,
  activeIndex,
  nextIndex,
  phaseRemainingMs,
  phaseTotalMs,
}: {
  mode: Mode;
  activeIndex: number;
  nextIndex: number;
  phaseRemainingMs: number;
  phaseTotalMs: number;
}) {
  const globeRef = useRef<any>(null);

  // Confetti overlay canvas (guaranteed above WebGL)
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<ReturnType<typeof confetti.create> | null>(null);
  const confettiTimerRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(phaseRemainingMs);

  const [dims, setDims] = useState({ w: 0, h: 0 });

  // Track remaining time for clean confetti stop
  useEffect(() => {
    remainingRef.current = phaseRemainingMs;
  }, [phaseRemainingMs]);

  // Viewport sizing (for Globe)
  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Confetti canvas DPR sizing
  useEffect(() => {
    const c = confettiCanvasRef.current;
    if (!c) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Create confetti instance bound to our overlay canvas
  useEffect(() => {
    const c = confettiCanvasRef.current;
    if (!c) return;

    confettiRef.current = confetti.create(c, {
      resize: true,
      useWorker: true,
    });
  }, []);

  const safeActive = useMemo(() => {
    if (!STOPS.length) return null;
    const i = ((activeIndex % STOPS.length) + STOPS.length) % STOPS.length;
    return STOPS[i];
  }, [activeIndex]);

  const safeNext = useMemo(() => {
    if (!STOPS.length) return null;
    const i = ((nextIndex % STOPS.length) + STOPS.length) % STOPS.length;
    return STOPS[i];
  }, [nextIndex]);

  // Only show marker during CELEBRATE
  const pointsData = useMemo(() => {
    if (mode !== "CELEBRATE" || !safeActive) return [];
    return [safeActive];
  }, [mode, safeActive]);

  const ringsData = useMemo(() => {
    if (mode !== "CELEBRATE" || !safeActive) return [];
    return [
      {
        lat: safeActive.lat,
        lng: safeActive.lon,
        color: "rgba(255,210,140,0.95)",
        maxR: 3.8,
        propagationSpeed: 2.0,
        repeatPeriod: 950,
      },
    ];
  }, [mode, safeActive]);

  /** Apply “north-up / no tilt” constraints in GLOBE mode */
  const applyGlobeLock = () => {
    const globe = globeRef.current;
    const controls = globe?.controls?.();
    const cam = globe?.camera?.();
    if (!controls || !cam) return false;

    cam.up.set(0, 1, 0);

    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    // 🔥 This is the real fix:
    // lock polar angle so the camera always stays on the equator
    controls.minPolarAngle = POLAR_EQUATOR;
    controls.maxPolarAngle = POLAR_EQUATOR;

    controls.update();
    return true;
  };

  /** Unlock for CELEBRATE so we can tilt to any latitude */
  const applyCelebrateUnlock = () => {
    const globe = globeRef.current;
    const controls = globe?.controls?.();
    const cam = globe?.camera?.();
    if (!controls || !cam) return false;

    cam.up.set(0, 1, 0);

    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    // allow full range while celebrating
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI - 0.05;

    controls.update();
    return true;
  };

  // Initial view + ensure controls exist + lock immediately
  useEffect(() => {
    let raf = 0;
    let tries = 0;

    const init = () => {
      const globe = globeRef.current;
      if (!globe) return;

      // start at a clean equator baseline
      globe.pointOfView({ lat: 0, lng: 0, altitude: HOME_ALT }, 0);

      // wait for controls then lock
      if (applyGlobeLock()) return;

      tries += 1;
      if (tries < 120) raf = requestAnimationFrame(init);
    };

    init();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-rotate: on in GLOBE, off in CELEBRATE (and enforce lock/unlock)
  useEffect(() => {
    let raf = 0;
    let tries = 0;

    const apply = () => {
      const globe = globeRef.current;
      const controls = globe?.controls?.();
      if (!controls) {
        tries += 1;
        if (tries < 120) raf = requestAnimationFrame(apply);
        return;
      }

      if (mode === "GLOBE") {
        applyGlobeLock();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.18;
      } else {
        applyCelebrateUnlock();
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0;
      }

      controls.update();
    };

    apply();
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // Camera choreography:
  // - GLOBE: always equator view, only yaw (lng). No tilt.
  // - CELEBRATE: real lat/lng zoom-in.
  // Camera choreography:
// - GLOBE: keep equator lock, zoom out at CURRENT lng (no Africa flash), then slide to next lng
// - CELEBRATE: unlock, real lat/lng zoom-in
useEffect(() => {
  const globe = globeRef.current;
  if (!globe) return;

  let t1: number | undefined;
  let t2: number | undefined;

  if (mode === "GLOBE") {
    // lock immediately (this may clamp polar angle) BUT we won't change lng to 0
    applyGlobeLock();

    // read current POV so we don't snap to Africa (lng=0)
    const cur = globe.pointOfView?.() || {};
    const curLng =
      typeof cur.lng === "number"
        ? cur.lng
        : typeof safeNext?.lon === "number"
          ? safeNext.lon
          : 0;

    const targetLng =
      typeof safeNext?.lon === "number" ? safeNext.lon : curLng;

    // Step A: zoom out first, staying at CURRENT longitude
    globe.pointOfView({ lat: 0, lng: curLng, altitude: HOME_ALT }, 450);

    // Step B: then rotate/fly to the next longitude
    t1 = window.setTimeout(() => {
      if (!globeRef.current) return;
      globeRef.current.pointOfView({ lat: 0, lng: targetLng, altitude: HOME_ALT }, 900);
    }, 520);

    // Step C: re-apply lock after motion settles (keeps it perfectly aligned)
    t2 = window.setTimeout(() => {
      applyGlobeLock();
    }, 1550);
  }

  if (mode === "CELEBRATE" && safeActive) {
    applyCelebrateUnlock();

    globe.pointOfView(
      { lat: safeActive.lat, lng: safeActive.lon, altitude: MID_ALT },
      650
    );

    t1 = window.setTimeout(() => {
      if (!globeRef.current) return;
      globeRef.current.pointOfView(
        { lat: safeActive.lat, lng: safeActive.lon, altitude: CLOSE_ALT },
        950
      );
    }, 520);
  }

  return () => {
    if (t1) window.clearTimeout(t1);
    if (t2) window.clearTimeout(t2);
  };
}, [mode, safeActive, safeNext]);

  // Confetti: full-screen + luxury
  useEffect(() => {
    if (confettiTimerRef.current) {
      window.clearInterval(confettiTimerRef.current);
      confettiTimerRef.current = null;
    }

    if (mode !== "CELEBRATE") return;

    const fx = confettiRef.current;
    if (!fx) return;

    const colors = ["#FFD36E", "#C79B2A", "#FFF6D6", "#FFFFFF"];

    const fire = (opts: any) =>
      fx({
        colors,
        disableForReducedMotion: false,
        ...opts,
      });

    const xs = [0.05, 0.18, 0.32, 0.5, 0.68, 0.82, 0.95];

    xs.forEach((x) => {
      fire({
        particleCount: 55,
        spread: 120,
        startVelocity: 55,
        scalar: 1.25,
        gravity: 0.9,
        ticks: 240,
        origin: { x, y: 0.65 },
      });
    });

    xs.forEach((x) => {
      fire({
        particleCount: 35,
        spread: 150,
        startVelocity: 20,
        scalar: 1.45,
        gravity: 0.45,
        ticks: 420,
        origin: { x, y: 0.55 },
      });
    });

    fire({
      particleCount: 120,
      spread: 160,
      startVelocity: 12,
      scalar: 1.55,
      gravity: 0.25,
      ticks: 520,
      origin: { x: 0.5, y: 0.42 },
    });

    confettiTimerRef.current = window.setInterval(() => {
      if (remainingRef.current <= 2000) {
        if (confettiTimerRef.current) {
          window.clearInterval(confettiTimerRef.current);
          confettiTimerRef.current = null;
        }
        return;
      }

      for (let k = 0; k < 8; k++) {
        const x = Math.random();
        const y = 0.25 + Math.random() * 0.35;

        fire({
          particleCount: 8,
          spread: 110,
          startVelocity: 8,
          scalar: 1.25,
          gravity: 0.28,
          ticks: 520,
          origin: { x, y },
        });
      }
    }, 300);

    return () => {
      if (confettiTimerRef.current) {
        window.clearInterval(confettiTimerRef.current);
        confettiTimerRef.current = null;
      }
    };
  }, [mode]);

  return (
    <div className="absolute inset-0 z-0 relative overflow-hidden">
      {/* Confetti overlay canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 z-[9999] pointer-events-none"
      />

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <Starfield />
      </div>

      {/* GLOBE */}
      <div className="relative z-10">
        <Globe
          ref={globeRef}
          style={{ display: "block" }}
          width={dims.w || 800}
          height={dims.h || 600}
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="white"
          atmosphereAltitude={0.18}
          // keep cinematic + prevents user knocking it off-axis
          enablePointerInteraction={false}
          // Marker only during CELEBRATE
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lon"
          pointColor={() => "rgba(255,210,140,0.95)"}
          pointAltitude={0.03}
          pointRadius={0.55}
          // Rings during celebration
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringColor="color"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
        />
      </div>

      {/* VIGNETTE */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_35%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.9)_100%)]" />
    </div>
  );
}
