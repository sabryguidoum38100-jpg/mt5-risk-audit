"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, GraduationCap, LayoutDashboard } from "lucide-react";
import AuditPropLogo from "@/components/auditprop-logo";

const links = [
  { href: "/", label: "Audit", icon: LayoutDashboard },
  { href: "/macro", label: "Macro", icon: BarChart3 },
  { href: "/academy", label: "Académie", icon: GraduationCap },
];

export default function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="border-b border-white/[0.07] bg-[#09090b]/95 px-5 py-2 backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto">
        <Link href="/" className="mr-3 flex shrink-0 items-center gap-2 px-2 py-2 text-xs font-semibold text-white">
          <AuditPropLogo className="h-7 w-7 text-emerald-400" />
          <span>AuditProp</span>
        </Link>
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${active ? "bg-emerald-400 text-black" : "text-zinc-500 hover:bg-white/5 hover:text-white"}`}><Icon className="h-3.5 w-3.5" />{label}</Link>;
        })}
        <label className="ml-auto flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-600">
          <span>Devise</span>
          <select defaultValue="EUR" aria-label="Devise principale" className="rounded-lg border border-white/10 bg-black px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-400">
            <option>EUR</option><option>USD</option><option>GBP</option>
          </select>
        </label>
      </div>
    </nav>
  );
}
