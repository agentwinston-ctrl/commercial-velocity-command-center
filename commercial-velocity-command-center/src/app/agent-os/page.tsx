import { AGENT_OS_DOCS, readAgentOsDoc } from "@/lib/agentOs";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AgentOSPage() {
  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent OS</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            This is the live operating spec for Winston inside OpenClaw. If you change the source files, re-sync them into this dashboard.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold text-[var(--muted)]">Quick nav</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {AGENT_OS_DOCS.map((d) => (
            <a
              key={d.id}
              href={`#${slugify(d.title)}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--panelSolid)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--panel)]"
            >
              {d.title}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {AGENT_OS_DOCS.map((d) => {
          const content = readAgentOsDoc(d.filename);
          return (
            <section
              key={d.id}
              id={slugify(d.title)}
              className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold tracking-tight">{d.title}</div>
                  <div className="mt-1 text-xs text-[var(--muted2)] font-mono">src/data/agent-os/{d.filename}</div>
                </div>
              </div>

              <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-[var(--border)] bg-[var(--panelSolid)] p-4 text-xs leading-relaxed text-[var(--text)]">
                {content}
              </pre>
            </section>
          );
        })}
      </div>
    </div>
  );
}
