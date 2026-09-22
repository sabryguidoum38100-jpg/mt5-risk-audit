import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Risk & Bias Audit — MT5",
  description:
    "Audit de risque et de biais psychologiques pour l'historique de trading MetaTrader 5.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} bg-black font-sans text-zinc-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
