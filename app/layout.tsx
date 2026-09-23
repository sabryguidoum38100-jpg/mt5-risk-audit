import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AuditProp — Prop Firm Intelligence",
  description:
    "Analyse comportementale IA et protection drawdown pour les challenges Prop Firm.",
  icons: { icon: "/icon" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} bg-[#09090b] font-sans text-zinc-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
