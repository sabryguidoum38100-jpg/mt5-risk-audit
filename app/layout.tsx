import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Risk & Bias Audit — Prop Firm Intelligence",
  description:
    "Analyse comportementale IA et protection drawdown pour les challenges Prop Firm.",
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
