import Link from "next/link";

function TabLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] transition hover:bg-[var(--panelSolid)]"
    >
      {label}
    </Link>
  );
}

export default function OpsPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ops</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Single hub. Click into each page from here.</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabLink href="/constraint" label="Constraint" />
        <TabLink href="/scoreboard" label="Scoreboard" />
        <TabLink href="/todos-devon" label="Devon Todo" />
        <TabLink href="/todos-winston" label="Winston Todo" />
        <TabLink href="/agent-os" label="Agent OS" />
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
        If you want true in-page tabs (no route change), I’ll convert this to a single page with tabbed sections next.
      </div>
    </div>
  );
}
