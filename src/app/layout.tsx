import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Kabianga Connect — Campus life, connected.",
  description:
    "Buy and sell, find hostels, order food, pick up gigs and access campus resources — one app for University of Kabianga students.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#138B87",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 md:pb-10">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
