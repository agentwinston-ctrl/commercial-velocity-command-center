"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/ceo", label: "CEO" },
  { href: "/ops", label: "Ops" },
  { href: "/constraint", label: "Constraint" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/todos-devon", label: "Devon Todo" },
  { href: "/todos-winston", label: "Winston Todo" },
  { href: "/sales", label: "Sales" },
  { href: "/marketing", label: "Marketing" },
  { href: "/fulfillment", label: "Fulfillment" },
  { href: "/finance", label: "Finance" },
  { href: "/approvals", label: "Approvals" },
  { href: "/agent-os", label: "Agent OS" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg)]/60 md:block">
      <div className="p-6">
        <div className="text-sm font-semibold tracking-tight text-[var(--text)]">
          Commercial Velocity
        </div>
        <div className="mt-1 text-xs text-[var(--muted3)]">Command Center</div>

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
                    ? "bg-[var(--panel)] text-[var(--text)]"
                    : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--panelSolid)] p-3">
          <div className="text-xs text-[var(--muted2)]">North Star</div>
          <div className="mt-1 text-sm font-semibold text-[var(--text)]">
            Cash Collected (30D)
          </div>
          <div className="mt-2 text-xs text-[var(--muted3)]">Volume negates luck.</div>
        </div>
      </div>
    </aside>
  );
}
