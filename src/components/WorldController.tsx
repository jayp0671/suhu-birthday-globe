"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeWorldState } from "../lib/schedule";
import GlobeScene from "./GlobeScene";
import { STOPS } from "../lib/stops";
import Starfield from "./Starfield";
import SpacePlanets from "./SpacePlanets";

const GLOBE_PHASE_MS = 45_000;
const CELEBRATE_PHASE_MS = 15_000;

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return { mm, ss };
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function ProgressRing({
  progress,
  size = 112,
  stroke = 8,
}: {
  progress: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * clamp01(progress);

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="transparent"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="transparent"
        stroke="rgba(255,255,255,0.90)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: "drop-shadow(0 0 12px rgba(160,200,255,0.28))" }}
      />
    </svg>
  );
}

export default function WorldController() {
  const [state, setState] = useState(() => computeWorldState());

  useEffect(() => {
    const t = setInterval(() => setState(computeWorldState()), 250);
    return () => clearInterval(t);
  }, []);

  const nextStop = useMemo(() => {
  if (!STOPS.length) return null;

  // During GLOBE phase, we're counting down *to* activeIndex
  if (state.phase === "GLOBE") {
    const i = ((state.activeIndex % STOPS.length) + STOPS.length) % STOPS.length;
    return STOPS[i];
  }

  // During CELEBRATE, the next is the following stop
  const i = ((state.nextIndex % STOPS.length) + STOPS.length) % STOPS.length;
  return STOPS[i];
}, [state.phase, state.activeIndex, state.nextIndex]);

  const activeStop = useMemo(() => {
    if (!STOPS.length) return null;
    const i = ((state.activeIndex % STOPS.length) + STOPS.length) % STOPS.length;
    return STOPS[i];
  }, [state.activeIndex]);

  const { mm, ss } = useMemo(() => formatCountdown(state.nextInMs), [state.nextInMs]);

  const phaseTotal = state.phase === "GLOBE" ? GLOBE_PHASE_MS : CELEBRATE_PHASE_MS;
  const progress = clamp01(state.nextInMs / phaseTotal);

  const hudGlow =
    state.phase === "GLOBE"
      ? "0 0 18px rgba(160,200,255,0.22)"
      : "0 0 18px rgba(255,170,200,0.18)";

  return (
    <div style={{ position: "fixed", inset: 0, background: "black", overflow: "hidden" }}>
      {/* Globe ALWAYS mounted */}
      <Starfield />
      <SpacePlanets />
      <GlobeScene
        mode={state.phase}
        activeIndex={state.activeIndex}
        nextIndex={state.nextIndex}
        phaseRemainingMs={state.nextInMs}
        phaseTotalMs={phaseTotal}
      />

      {/* Vignette */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)",
          zIndex: 5,
        }}
      />

      {/* Header */}
      <div style={{ position: "fixed", top: 24, left: 24, zIndex: 20, color: "white" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.28em", opacity: 0.9 }}>
          GLOBAL BIRTHDAY BROADCAST
        </div>
        <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600, opacity: 0.95 }}>
          Midnight Run - Replay
        </div>
      </div>

      {/* HUD */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 40,
          transform: "translateX(-50%)",
          zIndex: 20,
          width: "min(560px, 92vw)",
        }}
      >
        <div
          style={{
            position: "relative",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.20)",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(10px)",
            padding: "18px 20px",
            boxShadow: hudGlow,
            color: "white",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 1,
              background: "rgba(255,255,255,0.12)",
            }}
          />

          <AnimatePresence mode="wait">
            {state.phase === "GLOBE" ? (
              <motion.div
                key="globe-hud"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.22em", opacity: 0.9, textTransform: "uppercase" }}>
                    Next time zone
                  </div>
                  <div style={{ marginTop: 6, fontSize: 24, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {state.done
  ? "IN 2027 🌍"
  : nextStop
    ? `Next stop: ${nextStop.name}`
    : "Next: —"}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
                    My Suhu rules this world.
                  </div>
                </div>

                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={{ position: "relative" }}>
                    <ProgressRing progress={progress} />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ fontSize: 10, letterSpacing: "0.24em", opacity: 0.85, textTransform: "uppercase" }}>
                        in
                      </div>
                      <div
                        style={{
                          fontSize: 30,
                          fontWeight: 800,
                          fontVariantNumeric: "tabular-nums",
                          textShadow: "0 0 18px rgba(160,200,255,0.20)",
                        }}
                      >
                        {mm}:{ss}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="celebrate-hud"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                style={{ textAlign: "center" }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ fontSize: 12, letterSpacing: "0.28em", opacity: 0.9, textTransform: "uppercase" }}
                >
                  The world says
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
                  style={{ marginTop: 10, fontSize: 40, fontWeight: 900, textShadow: "0 0 22px rgba(255,170,200,0.22)" }}
                >
                  HAPPY BIRTHDAY SUHU
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut", delay: 0.18 }}
                  style={{ marginTop: 10, fontSize: 22, fontWeight: 650, opacity: 0.95 }}
                >
                  {activeStop ? `${activeStop.name}` : "—"}
                </motion.div>

                <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
                  HAPPY BIRTHDAY MY LOVE
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Debug */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 20,
          color: "white",
          fontSize: 12,
          background: "rgba(0,0,0,0.70)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 10,
          padding: "10px 12px",
        }}
      >
        {/* <div style={{ opacity: 0.9 }}>TEST</div>
        <div>Phase: {state.phase}</div>
        <div>Active: {state.activeIndex}</div>
        <div>Next: {state.nextIndex}</div> */}
      </div>
    </div>
  );
}
