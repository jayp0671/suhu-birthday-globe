import "./global.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "black",
          overflow: "hidden",
          height: "100vh",
          width: "100vw",
        }}
      >
        {children}
      </body>
    </html>
  );
}
