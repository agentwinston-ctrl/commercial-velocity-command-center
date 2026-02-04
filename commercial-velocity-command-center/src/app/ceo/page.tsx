import KpiCard from "@/components/KpiCard";
import { num, readLatestScoreboardRow, readThisWeekPriorities } from "@/lib/os";

function toneFromPct(value: number, good: number, warn: number) {
  if (!Number.isFinite(value)) return "neutral" as const;
  if (value >= good) return "good" as const;
  if (value >= warn) return "warn" as const;
  return "bad" as const;
}

function toneFromUnder(value: number, goodMax: number, warnMax: number) {
  if (!Number.isFinite(value)) return "neutral" as const;
  if (value <= goodMax) return "good" as const;
  if (value <= warnMax) return "warn" as const;
  return "bad" as const;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function progressPct(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, (current / target) * 100));
}

export default function CEOPage() {
  const row = readLatestScoreboardRow();

  const mrr = num(row, "mrr");
  const mrrTarget = num(row, "mrr_target", 100000);
  const cash7 = num(row, "cash_collected_7d");
  const cash30 = num(row, "cash_collected_30d");
  const churn30 = num(row, "churn_pct_30d");

  const activeClients = num(row, "active_clients");
  const newClientsMtd = num(row, "new_clients_mtd");
  const atRiskClients = (row?.at_risk_clients || "").trim();

  const leadsIn = num(row, "new_leads");
  const booked = num(row, "booked_calls");
  const showed = num(row, "showed_calls");
  const offers = num(row, "offers_made");
  const closed = num(row, "deals_closed");

  const speedToLead = num(row, "median_speed_to_lead_min");

  const bookingRate = leadsIn > 0 ? booked / leadsIn : 0;
  const showRate = booked > 0 ? showed / booked : 0;
  const closeRate = showed > 0 ? closed / showed : 0;
  const cashPerCall = showed > 0 ? cash7 / showed : 0;

  const priorities = readThisWeekPriorities();

  const constraint = (() => {
    // Order matters.
    if (speedToLead > 5) return { label: "Speed-to-lead", action: "Fix response time under 5 minutes." };
    if (leadsIn > 0 && bookingRate < 0.2) return { label: "Booking rate", action: "Tighten qualification + follow-up to convert leads into booked calls." };
    if (booked > 0 && showRate < 0.7) return { label: "Show rate", action: "Add confirmations, reminders, and reschedule flow." };
    if (showed > 0 && closeRate < 0.25) return { label: "Close rate", action: "Sharpen offer + sales script. Run follow-ups." };
    return { label: "None", action: "Keep volume. Don’t get cute." };
  })();

  const mrrProgress = progressPct(mrr, mrrTarget);

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CEO Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            One screen. North Star: <span className="font-semibold">$100k MRR</span>. No ceiling.
          </p>
        </div>
      </div>

      {/* REVENUE */}
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--muted)]">REVENUE</div>
          <div className="text-xs text-[var(--muted2)]">Source: Stripe + scoreboard</div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="MRR" value={`${money(mrr)} / ${money(mrrTarget)}`} tone={toneFromPct(mrrProgress / 100, 0.8, 0.5)} />
          <KpiCard label="Cash Collected (7D)" value={money(cash7)} tone={cash7 >= 5000 ? "good" : cash7 >= 2500 ? "warn" : "bad"} />
          <KpiCard label="Cash Collected (30D)" value={money(cash30)} tone={cash30 >= 50000 ? "good" : cash30 >= 30000 ? "warn" : "bad"} />
          <KpiCard label="Churn (30D)" value={`${churn30.toFixed(1)}%`} tone={toneFromUnder(churn30, 5, 10)} />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-[var(--muted2)]">
            <div>MRR Progress</div>
            <div>{mrrProgress.toFixed(0)}%</div>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--panelSolid)]">
            <div
              className="h-full rounded-full bg-[var(--good)]"
              style={{ width: `${mrrProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* CLIENTS */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Clients" value={String(activeClients)} tone={activeClients >= 20 ? "good" : activeClients >= 12 ? "warn" : "neutral"} />
        <KpiCard label="New Clients (MTD)" value={String(newClientsMtd)} tone={newClientsMtd >= 5 ? "good" : newClientsMtd >= 2 ? "warn" : "neutral"} />
        <KpiCard label="At-risk Clients" value={atRiskClients ? atRiskClients : "—"} tone={atRiskClients ? "warn" : "neutral"} hint="(Manual for now)" />
        <KpiCard label="Target" value="Grand Slam only" hint="Up-market, capacity, sales process." />
      </div>

      {/* PIPELINE FUNNEL */}
      <div className="mt-10">
        <div className="text-sm font-semibold text-[var(--muted)]">PIPELINE (weekly)</div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
          <KpiCard label="Leads In" value={String(leadsIn || 0)} tone={leadsIn >= 25 ? "good" : leadsIn >= 10 ? "warn" : "bad"} />
          <KpiCard label="Calls Booked" value={String(booked || 0)} tone={toneFromPct(bookingRate, 0.25, 0.15)} hint={`Booking rate: ${(bookingRate * 100).toFixed(0)}%`} />
          <KpiCard label="Shows" value={String(showed || 0)} tone={toneFromPct(showRate, 0.75, 0.6)} hint={`Show rate: ${(showRate * 100).toFixed(0)}%`} />
          <KpiCard label="Offers" value={String(offers || 0)} tone={offers >= 5 ? "good" : offers >= 2 ? "warn" : "neutral"} />
          <KpiCard label="Closed" value={String(closed || 0)} tone={toneFromPct(closeRate, 0.35, 0.25)} hint={`Close rate: ${(closeRate * 100).toFixed(0)}%`} />
        </div>
      </div>

      {/* VELOCITY METRICS */}
      <div className="mt-10">
        <div className="text-sm font-semibold text-[var(--muted)]">VELOCITY METRICS</div>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Speed to Lead (median)" value={speedToLead ? `${speedToLead.toFixed(1)} min` : "MISSING"} tone={speedToLead ? toneFromUnder(speedToLead, 5, 10) : "bad"} hint="Target under 5 min." />
          <KpiCard label="Show Rate" value={`${(showRate * 100).toFixed(0)}%`} tone={toneFromPct(showRate, 0.75, 0.6)} />
          <KpiCard label="Close Rate" value={`${(closeRate * 100).toFixed(0)}%`} tone={toneFromPct(closeRate, 0.35, 0.25)} />
          <KpiCard label="Cash per Call" value={showed ? money(cashPerCall) : "—"} tone={cashPerCall >= 1500 ? "good" : cashPerCall >= 800 ? "warn" : "neutral"} />
        </div>
      </div>

      {/* THE CONSTRAINT */}
      <div className="mt-10 rounded-2xl border border-[color:color-mix(in_oklab,var(--bad),transparent_70%)] bg-[color:color-mix(in_oklab,var(--bad),transparent_93%)] p-5">
        <div className="text-sm font-semibold">THE CONSTRAINT</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{constraint.label}</div>
        <div className="mt-2 text-sm text-[var(--muted)]">{constraint.action}</div>
      </div>

      {/* THIS WEEK */}
      <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--muted)]">THIS WEEK’S PRIORITIES</div>
            <div className="mt-1 text-xs text-[var(--muted2)]">
              {priorities.weekOf ? `Week of ${priorities.weekOf}` : "Update in mission-control/operating-system/weekly/this-week.md"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <ol className="space-y-2 text-sm text-[var(--text)]">
              {(priorities.priorities.length ? priorities.priorities : ["(Add priority 1)", "(Add priority 2)", "(Add priority 3)"]).map((p, idx) => (
                <li key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--panelSolid)] px-4 py-3">
                  <span className="mr-2 text-[var(--muted2)]">{idx + 1}.</span>
                  {p}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panelSolid)] p-4">
            <div className="text-xs font-semibold text-[var(--muted2)]">One thing to attack today</div>
            <div className="mt-2 text-lg font-semibold">
              {priorities.todayFocus ? priorities.todayFocus : constraint.label === "None" ? "More outbound. More volume." : constraint.action}
            </div>
            <div className="mt-2 text-sm text-[var(--muted2)]">
              Rule: attack the constraint first. Then scale.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
