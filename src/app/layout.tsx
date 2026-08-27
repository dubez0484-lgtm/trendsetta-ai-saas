import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "THETRENDSETTA",
  description: "Shared core platform for THETRENDSETTA products.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
