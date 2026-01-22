"use client";

export default function SpacePlanets() {
  return (
<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Planet A (left) */}
      <div
        className="absolute -left-32 top-24 w-[520px] h-[520px] rounded-full blur-[0.2px] opacity-90 animate-[floatA_18s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), rgba(140,190,255,0.28) 28%, rgba(45,80,160,0.22) 52%, rgba(0,0,0,0) 70%)",
          filter: "drop-shadow(0 0 45px rgba(110,160,255,0.14))",
          mixBlendMode: "screen",
        }}
      />

      {/* Planet B (right, farther) */}
      <div
        className="absolute -right-48 bottom-10 w-[680px] h-[680px] rounded-full opacity-80 animate-[floatB_26s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.35), rgba(255,210,140,0.16) 25%, rgba(120,70,30,0.16) 48%, rgba(0,0,0,0) 72%)",
          filter: "drop-shadow(0 0 60px rgba(255,210,140,0.10))",
          mixBlendMode: "screen",
        }}
      />

      {/* Tiny moon-ish planet (top right) */}
      <div
        className="absolute right-24 top-20 w-[160px] h-[160px] rounded-full opacity-70 animate-[floatC_14s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), rgba(180,180,180,0.20) 45%, rgba(0,0,0,0) 75%)",
          filter: "drop-shadow(0 0 22px rgba(255,255,255,0.10))",
          mixBlendMode: "screen",
        }}
      />

      <style jsx>{`
        @keyframes floatA {
          0% {
            transform: translate3d(0px, 0px, 0);
          }
          50% {
            transform: translate3d(22px, 12px, 0);
          }
          100% {
            transform: translate3d(0px, 0px, 0);
          }
        }
        @keyframes floatB {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
          50% {
            transform: translate3d(-18px, -10px, 0) scale(1.015);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
        }
        @keyframes floatC {
          0% {
            transform: translate3d(0px, 0px, 0);
          }
          50% {
            transform: translate3d(-10px, 8px, 0);
          }
          100% {
            transform: translate3d(0px, 0px, 0);
          }
        }
      `}</style>
    </div>
  );
}
