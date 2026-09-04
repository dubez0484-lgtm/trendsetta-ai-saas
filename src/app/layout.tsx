import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "THETRENDSETTA™ Social OS",
  description: "Mobile-first content operating system for THETRENDSETTA™.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050608",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-body">
      <body className="min-h-screen bg-matte-950 text-white antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-h-screen w-full flex-col">
            <main className="flex-1 pb-24 md:pb-6">{children}</main>
          </div>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
