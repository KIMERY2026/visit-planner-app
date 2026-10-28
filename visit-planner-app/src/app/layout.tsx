import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visit Planner",
  description: "Plan, track and prioritize constituency visits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-[IBM_Plex_Sans] antialiased">{children}</body>
    </html>
  );
}
