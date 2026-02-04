import KpiCard from "@/components/KpiCard";
import { readThisWeekPriorities } from "@/lib/os";

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

import { headers } from "next/headers";

async function getMetrics() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    const base = host ? `${proto}://${host}` : "";

    const res = await fetch(`${base}/api/ceo`, { cache: "no-store" });

    // If deployment protection redirects to HTML, JSON parsing will throw.
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {
        connected: false,
        cash7d: 0,
        cashMtd: 0,
        cashTargetMonthly: 150000,
        warning:
          "Dashboard is behind Vercel login (deployment protection). Make the project public or add your Vercel user to the team.",
      };
    }

    const data = await res.json();

    if (!res.ok) {
      return {
        connected: true,
        error: data?.error || "Failed to load metrics",
        cash7d: 0,
        cashMtd: 0,
        cashTargetMonthly: 150000,
      };
    }

    return data as {
      connected: boolean;
      warning?: string;
      error?: string;
      cash7d: number;
      cashMtd: number;
      cashTargetMonthly: number;
    };
  } catch {
    return {
      connected: false,
      cash7d: 0,
      cashMtd: 0,
      cashTargetMonthly: 150000,
      warning:
        "Dashboard is behind Vercel login (deployment protection). Make the project public or add your Vercel user to the team.",
    };
  }
}

export default async function CEOPage() {
  const metrics = await getMetrics();

  const cash7 = metrics.cash7d;
  const cashMtd = metrics.cashMtd;
  const cashTargetMonthly = metrics.cashTargetMonthly || 150000;

  const atRiskClients = "";

  // Pipeline placeholders until GHL is wired.
  const leadsIn = 0;
  const booked = 0;
  const showed = 0;
  const offers = 0;
  const closed = 0;

  const speedToLead = Number.NaN;

  const bookingRate = leadsIn > 0 ? booked / leadsIn : 0;
  const showRate = booked > 0 ? showed / booked : 0;
  const closeRate = showed > 0 ? closed / showed : 0;
  const cashPerCall = showed > 0 ? cash7 / showed : 0;

  const priorities = readThisWeekPriorities();

  const constraint = (() => {
    if (Number.isFinite(speedToLead) && speedToLead > 5) return { label: "Speed-to-lead", action: "Fix response time under 5 minutes." };
    if (leadsIn > 0 && bookingRate < 0.2) return { label: "Booking rate", action: "Tighten qualification + follow-up to convert leads into booked calls." };
    if (booked > 0 && showRate < 0.7) return { label: "Show rate", action: "Add confirmations, reminders, and reschedule flow." };
    if (showed > 0 && closeRate < 0.25) return { label: "Close rate", action: "Sharpen offer + sales script. Run follow-ups." };
    return { label: "Leads", action: "Push outbound volume today." };
  })();

  // Cash is the only North Star.

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CEO Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            One screen. North Star: <span className="font-semibold">$150k cash collected per month</span>. No ceiling.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--muted)]">REVENUE</div>
          <div className="text-xs text-[var(--muted2)]">Source: Stripe</div>
        </div>

        {!metrics.connected ? (
          <div className="mt-3 rounded-xl border border-[color:color-mix(in_oklab,var(--warn),transparent_70%)] bg-[color:color-mix(in_oklab,var(--warn),transparent_93%)] px-4 py-3 text-sm">
            <div className="font-semibold">Stripe not connected</div>
            <div className="mt-1 text-[var(--muted)]">Add <span className="font-mono">STRIPE_SECRET_KEY</span> in Vercel env vars, then redeploy.</div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Cash Collected (MTD)"
            value={`${money(cashMtd)} / ${money(cashTargetMonthly)}`}
            tone={toneFromPct(progressPct(cashMtd, cashTargetMonthly) / 100, 0.8, 0.5)}
          />
          <KpiCard label="Cash Collected (7D)" value={money(cash7)} tone={cash7 >= 15000 ? "good" : cash7 >= 7500 ? "warn" : "bad"} />
          <KpiCard label="Cash Remaining (MTD)" value={money(Math.max(0, cashTargetMonthly - cashMtd))} tone={cashMtd >= cashTargetMonthly ? "good" : "warn"} />
          <KpiCard label="Stripe Status" value={metrics.connected ? "Connected" : "Not Connected"} tone={metrics.connected ? "good" : "bad"} />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-[var(--muted2)]">
            <div>Cash Progress (MTD)</div>
            <div>{progressPct(cashMtd, cashTargetMonthly).toFixed(0)}%</div>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--panelSolid)]">
            <div
              className="h-full rounded-full bg-[var(--good)]"
              style={{ width: `${progressPct(cashMtd, cashTargetMonthly)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Cash Target" value={money(cashTargetMonthly)} hint="Monthly. Simple." />
        <KpiCard label="Cash MTD" value={money(cashMtd)} tone={cashMtd >= cashTargetMonthly ? "good" : cashMtd >= cashTargetMonthly * 0.5 ? "warn" : "bad"} />
        <KpiCard label="At-risk Clients" value={atRiskClients ? atRiskClients : "—"} tone={atRiskClients ? "warn" : "neutral"} hint="(Manual for now)" />
        <KpiCard label="Target" value="Grand Slam only" hint="Up-market, capacity, sales process." />
      </div>

      <div className="mt-10">
        <div className="text-sm font-semibold text-[var(--muted)]">PIPELINE (weekly)</div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
          <KpiCard label="Leads In" value={String(leadsIn)} tone={"warn"} hint="Wire GHL next" />
          <KpiCard label="Calls Booked" value={String(booked)} tone={"warn"} />
          <KpiCard label="Shows" value={String(showed)} tone={"warn"} />
          <KpiCard label="Offers" value={String(offers)} tone={"warn"} />
          <KpiCard label="Closed" value={String(closed)} tone={"warn"} />
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-[color:color-mix(in_oklab,var(--bad),transparent_70%)] bg-[color:color-mix(in_oklab,var(--bad),transparent_93%)] p-5">
        <div className="text-sm font-semibold">THE CONSTRAINT</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{constraint.label}</div>
        <div className="mt-2 text-sm text-[var(--muted)]">{constraint.action}</div>
      </div>

      <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold text-[var(--muted)]">THIS WEEK’S PRIORITIES</div>
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
              {priorities.todayFocus ? priorities.todayFocus : constraint.action}
            </div>
            <div className="mt-2 text-sm text-[var(--muted2)]">Rule: attack the constraint first. Then scale.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
