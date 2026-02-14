import { getLastWeekRow, num } from "@/lib/scoreboard";

function fmt(v: string | undefined) {
  const t = String(v ?? "").trim();
  return t ? t : "N/A";
}

export default function ConstraintPage() {
  const last = getLastWeekRow();

  if (!last) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Constraint</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">No scoreboard data found.</p>
      </div>
    );
  }

  const churn = num(last.churn_pct_30d_logo);
  const cash = num(last.cash_collected_7d_usd);
  const held = num(last.calls_held_7d_count);

  const emergencyMode = churn !== null && churn > 20;
  const retentionAlert = churn !== null && churn > 15;

  const constraint = (() => {
    if (emergencyMode) return "Retention (Delivery Audit Mode)";
    if (retentionAlert) return "Retention";
    // Cash trend rule requires 2-week comparison. Not implemented here yet.
    return "Constraint cannot be determined from available data (acquisition metrics missing or trend rules not computed).";
  })();

  const utilization = held !== null ? `${((held / 40) * 100).toFixed(0)}%` : "N/A";

  return (
    <div>
      <div>
        {emergencyMode ? (
          <div className="mb-4 rounded-xl border border-[color:color-mix(in_oklab,var(--bad),transparent_70%)] bg-[color:color-mix(in_oklab,var(--bad),transparent_93%)] px-4 py-3 text-sm">
            <div className="font-semibold">EMERGENCY MODE</div>
            <div className="mt-1 text-[var(--muted)]">Freeze lower-tier optimization. Retention-first until resolved.</div>
          </div>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight">Constraint</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Threshold-based detection from last week’s row.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-xs font-semibold text-[var(--muted2)]">PRIMARY CONSTRAINT</div>
          <div className="mt-2 text-lg font-semibold">{constraint}</div>
          <div className="mt-3 text-sm text-[var(--muted)]">
            Based on: churn_pct_30d_logo={fmt(last.churn_pct_30d_logo)} and cash_collected_7d_usd={fmt(last.cash_collected_7d_usd)}.
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-xs font-semibold text-[var(--muted2)]">LAST WEEK SNAPSHOT</div>
          <div className="mt-3 text-sm text-[var(--text)] font-mono">week_start_date={fmt(last.week_start_date)}</div>
          <div className="mt-2 text-sm text-[var(--text)] font-mono">cash_collected_7d_usd={fmt(last.cash_collected_7d_usd)}</div>
          <div className="mt-2 text-sm text-[var(--text)] font-mono">churn_pct_30d_logo={fmt(last.churn_pct_30d_logo)}</div>
          <div className="mt-2 text-sm text-[var(--text)] font-mono">calls_held_7d_count={fmt(last.calls_held_7d_count)} (utilization {utilization})</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
        Next: implement cash trend rule (2 consecutive weeks) and acquisition chain once GHL is wired.
      </div>
    </div>
  );
}
