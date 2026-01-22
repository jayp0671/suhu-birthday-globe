"use client";

import GlobeScene from "../../components/GlobeScene";

export default function Page() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 9999,
          color: "white",
          background: "rgba(0,128,255,0.35)",
          padding: "8px 10px",
          borderRadius: 8,
        }}
      >
        /globe-test (always globe)
      </div>
      <GlobeScene focusIndex={0} />
    </div>
  );
}
