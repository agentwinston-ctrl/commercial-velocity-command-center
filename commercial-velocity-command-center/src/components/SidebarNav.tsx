"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/ceo", label: "CEO" },
  { href: "/sales", label: "Sales" },
  { href: "/marketing", label: "Marketing" },
  { href: "/fulfillment", label: "Fulfillment" },
  { href: "/finance", label: "Finance" },
  { href: "/approvals", label: "Approvals" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-900 bg-slate-950/60 md:block">
      <div className="p-6">
        <div className="text-sm font-semibold tracking-tight text-slate-100">
          Commercial Velocity
        </div>
        <div className="mt-1 text-xs text-slate-400">Command Center</div>

        <nav className="mt-6 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "block rounded-lg px-3 py-2 text-sm transition " +
                  (active
                    ? "bg-slate-900 text-slate-50"
                    : "text-slate-300 hover:bg-slate-900/60 hover:text-slate-50")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-xl border border-slate-900 bg-slate-950 p-3">
          <div className="text-xs text-slate-400">North Star</div>
          <div className="mt-1 text-sm font-semibold text-slate-100">
            Cash Collected (30D)
          </div>
          <div className="mt-2 text-xs text-slate-500">Volume negates luck.</div>
        </div>
      </div>
    </aside>
  );
}
