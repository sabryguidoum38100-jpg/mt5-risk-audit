"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Brain, GraduationCap, LayoutDashboard } from "lucide-react";

const links = [
  { href: "/", label: "Audit MT5", icon: LayoutDashboard },
  { href: "/macro", label: "Macro & Fondamental", icon: BarChart3 },
  { href: "/academy", label: "Académie Prop Firm", icon: GraduationCap },
];

export default function SiteNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="border-b border-white/[0.07] bg-black/95 px-5 py-2 backdrop-blur sm:px-8"
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto">
        <Link
          href="/"
          className="mr-3 flex shrink-0 items-center gap-2 px-2 py-2 text-xs font-semibold text-white"
        >
          <Brain className="h-4 w-4 text-sky-300" /> Risk &amp; Bias
        </Link>
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${active ? "bg-white text-black" : "text-zinc-500 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
