import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://mt5-risk-audit.vercel.app"),
  title: "AuditProp — Intelligence Comportementale & Risk OS pour Traders",
  description:
    "AuditProp est un Trading OS et moteur de décision IA : métriques explicables, contexte macro live et analyse comportementale à partir de vos données réelles.",
  icons: { icon: "/icon" },
  openGraph: {
    title: "AuditProp — Intelligence Comportementale & Risk OS pour Traders",
    description: "Comprenez vos biais, mesurez votre risque et structurez vos décisions à partir de données réelles.",
    type: "website",
    locale: "fr_FR",
    siteName: "AuditProp",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AuditProp Risk OS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditProp — Risk OS pour Traders",
    description: "Trading OS, intelligence comportementale et protection du drawdown pour traders.",
    images: ["/opengraph-image"],
  },
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
