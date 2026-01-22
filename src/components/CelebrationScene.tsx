"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";
import { STOPS } from "../lib/stops";

export default function CelebrationScene({ index }: { index: number }) {
  const stop = STOPS[index];

  useEffect(() => {
    confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
  }, [index]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center text-white"
      style={{
        backgroundImage: `url(${stop.bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="backdrop-blur-md bg-black/40 p-10 rounded-xl text-center">
        <h1 className="text-5xl font-bold">HAPPY BIRTHDAY</h1>
        <p className="text-2xl mt-4">
          from {stop.name}
        </p>
      </div>
    </div>
  );
}
