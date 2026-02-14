#!/usr/bin/env node
/**
 * Stripe-only weekly scoreboard updater (CRE).
 * Writes to: mission-control/operating-system/scoreboard/scoreboard.csv
 *
 * Schema (12 cols):
 * week_start_date,cash_collected_7d_usd,clients_active_start_of_month_count,clients_churned_mtd_count,churn_pct_30d_logo,clients_at_risk_count,median_speed_to_lead_min,new_leads_7d_count,calls_booked_7d_count,calls_held_7d_count,deals_closed_7d_count,calendar_capacity_calls_per_week
 *
 * Notes:
 * - This script currently fills Stripe-derived fields + calendar_capacity_calls_per_week.
 * - GHL-derived fields are left blank until GHL integration is finalized.
 * - Uses timestamp logic for activity at time T (created <= T and (canceled_at is null or > T)).
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const EXPECTED_COLS = [
  'week_start_date',
  'cash_collected_7d_usd',
  'clients_active_start_of_month_count',
  'clients_churned_mtd_count',
  'churn_pct_30d_logo',
  'clients_at_risk_count',
  'median_speed_to_lead_min',
  'new_leads_7d_count',
  'calls_booked_7d_count',
  'calls_held_7d_count',
  'deals_closed_7d_count',
  'calendar_capacity_calls_per_week',
];

function loadDotEnv(dotEnvPath) {
  if (!fs.existsSync(dotEnvPath)) return;
  const raw = fs.readFileSync(dotEnvPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function mondayStartLocal(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun..6 Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthStartLocal(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function unix(d) {
  return Math.floor(d.getTime() / 1000);
}

function pct(n) {
  // n is already a percentage in the range 0..100
  if (!Number.isFinite(n)) return '';
  return Math.round(n * 10) / 10; // 0.1%
}

function dollarsFromCents(cents) {
  return Math.round((cents / 100) * 100) / 100;
}

async function stripeFetch(endpoint, params = {}, stripeKey) {
  const url = new URL(`https://api.stripe.com${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, String(item));
      continue;
    }
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Stripe API error ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

async function paginateStripeList(endpoint, baseParams, stripeKey) {
  let starting_after = undefined;
  const out = [];
  while (true) {
    const page = await stripeFetch(
      endpoint,
      {
        ...baseParams,
        limit: 100,
        ...(starting_after ? { starting_after } : {}),
      },
      stripeKey
    );
    out.push(...(page.data || []));
    if (!page.has_more) break;
    starting_after = page.data?.[page.data.length - 1]?.id;
  }
  return out;
}

function listToCustomerSet(subs) {
  const s = new Set();
  for (const sub of subs) {
    if (sub?.customer) s.add(String(sub.customer));
  }
  return s;
}

function isActiveAt(sub, ts) {
  const created = sub?.created || 0;
  const canceledAt = sub?.canceled_at || null;
  if (!created || created > ts) return false;
  if (canceledAt && canceledAt <= ts) return false;
  return true;
}

function inWindow(ts, startTs, endTs) {
  return ts >= startTs && ts < endTs;
}

function monthKeyFromTs(ts) {
  const d = new Date(ts * 1000);
  // local month boundary is not needed for keying; used for grouping only.
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function computeStripeMetrics({ subsAll, windowStart, windowEnd, monthStartTs, rolling30Start, rolling30End }) {
  // Simplified retention model (per Devon):
  // Active = subscription status "active".
  // Churn = subscription status "canceled" OR paused (pause_collection present).
  // At-risk is not tracked for now.
  //
  // NOTE: For historical windows, Stripe does not provide pause_collection start timestamps.
  // We therefore treat pause_collection as a current state and apply it at window end.

  const activeAtMonthStart = new Set();
  for (const s of subsAll) {
    if (!isActiveAt(s, monthStartTs)) continue;
    if (String(s.status || '').toLowerCase() === 'active') activeAtMonthStart.add(String(s.customer));
  }

  // Churn MTD: customers active at month start that became canceled OR paused by window end.
  const churnedMtd = new Set();
  for (const s of subsAll) {
    const cust = String(s.customer);
    if (!activeAtMonthStart.has(cust)) continue;

    const canceledAt = s?.canceled_at || null;
    const canceledInWindow = canceledAt && inWindow(canceledAt, monthStartTs, windowEnd);

    const pausedNow = !!s.pause_collection;
    const isCanceledNow = String(s.status || '').toLowerCase() === 'canceled';

    // paused is treated as churn, but we can't timestamp it historically, so we apply at window end.
    if (canceledInWindow || isCanceledNow || pausedNow) churnedMtd.add(cust);
  }

  // Rolling 30d churn: among customers active (active status) at rolling30Start, how many are churned by rolling30End.
  const activeAtRollingStart = new Set();
  for (const s of subsAll) {
    if (!isActiveAt(s, rolling30Start)) continue;
    if (String(s.status || '').toLowerCase() === 'active') activeAtRollingStart.add(String(s.customer));
  }

  const churned30 = new Set();
  for (const s of subsAll) {
    const cust = String(s.customer);
    if (!activeAtRollingStart.has(cust)) continue;

    const canceledAt = s?.canceled_at || null;
    const canceledInWindow = canceledAt && inWindow(canceledAt, rolling30Start, rolling30End);

    const pausedNow = !!s.pause_collection;
    const isCanceledNow = String(s.status || '').toLowerCase() === 'canceled';

    if (canceledInWindow || isCanceledNow || pausedNow) churned30.add(cust);
  }

  const churnPct30 = activeAtRollingStart.size > 0 ? (churned30.size / activeAtRollingStart.size) * 100 : 0;

  return {
    clients_active_start_of_month_count: activeAtMonthStart.size,
    clients_churned_mtd_count: churnedMtd.size,
    churn_pct_30d_logo: pct(churnPct30),
    clients_at_risk_count: '',
  };
}

async function computeCashCollected7d({ stripeKey, windowStart, windowEnd }) {
  const charges = await paginateStripeList(
    '/v1/charges',
    {
      'created[gte]': windowStart,
      'created[lte]': windowEnd - 1,
    },
    stripeKey
  );

  let gross = 0;
  let refunded = 0;
  for (const c of charges) {
    if (!c.paid) continue;
    if (c.status !== 'succeeded') continue;
    gross += c.amount || 0;
    refunded += c.amount_refunded || 0;
  }

  return dollarsFromCents(gross - refunded);
}

function ensureScoreboard(csvPath) {
  if (!fs.existsSync(csvPath)) {
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(csvPath, EXPECTED_COLS.join(',') + '\n', 'utf8');
    return;
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const [headerLine] = raw.split(/\r?\n/);
  const headerCols = headerLine.split(',').map((s) => s.trim()).filter(Boolean);

  const same = headerCols.length === EXPECTED_COLS.length && headerCols.every((c, i) => c === EXPECTED_COLS[i]);
  if (same) return;

  // Production-safe: backup then rewrite header, keep existing rows if they have a first column.
  const bak = `${csvPath}.bak.${Date.now()}`;
  fs.copyFileSync(csvPath, bak);

  const lines = raw.trimEnd().split(/\r?\n/);
  const rows = lines.slice(1).filter(Boolean);

  const out = [EXPECTED_COLS.join(',')];
  // Try to preserve existing rows by assuming first column is week_start_date
  for (const r of rows) {
    const first = r.split(',')[0];
    if (!first) continue;
    const row = new Array(EXPECTED_COLS.length).fill('');
    row[0] = first;
    out.push(row.join(','));
  }

  fs.writeFileSync(csvPath, out.join('\n') + '\n', 'utf8');
  console.log(`Rewrote scoreboard header (backup at ${bak})`);
}

function upsertRow(csvPath, weekStartISO, patch) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.trimEnd().split(/\r?\n/);
  const header = lines[0];
  const rows = lines.slice(1);
  const cols = header.split(',');
  const idx = Object.fromEntries(cols.map((c, i) => [c, i]));

  const make = () => {
    const row = new Array(cols.length).fill('');
    row[idx.week_start_date] = weekStartISO;
    for (const [k, v] of Object.entries(patch)) {
      if (!(k in idx)) continue;
      row[idx[k]] = String(v ?? '');
    }
    return row.join(',');
  };

  let found = false;
  const nextRows = rows.map((r) => {
    const first = r.split(',')[0];
    if (first === weekStartISO) {
      found = true;
      return make();
    }
    return r;
  });

  if (!found) nextRows.push(make());

  fs.writeFileSync(csvPath, [header, ...nextRows].join('\n') + '\n', 'utf8');
}

async function main() {
  const workspaceDir = process.cwd();
  loadDotEnv(path.join(workspaceDir, '.env'));

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('Missing STRIPE_SECRET_KEY in workspace/.env');
    process.exit(1);
  }

  const weekStart = mondayStartLocal();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthStart = monthStartLocal(weekStart);

  const rolling30End = unix(weekEnd);
  const rolling30Start = rolling30End - 30 * 24 * 60 * 60;

  const windowStart = unix(weekStart);
  const windowEnd = unix(weekEnd);
  const monthStartTs = unix(monthStart);

  const scoreboardPath = path.join(workspaceDir, 'mission-control/operating-system/scoreboard/scoreboard.csv');
  ensureScoreboard(scoreboardPath);

  // Pull subscriptions once (all statuses) for timestamp math.
  const subsAll = await paginateStripeList('/v1/subscriptions', { status: 'all' }, stripeKey);

  const retention = computeStripeMetrics({
    subsAll,
    windowStart,
    windowEnd,
    monthStartTs,
    rolling30Start,
    rolling30End,
  });

  const cash7 = await computeCashCollected7d({ stripeKey, windowStart, windowEnd });

  const patch = {
    cash_collected_7d_usd: cash7,
    ...retention,
    calendar_capacity_calls_per_week: 40,
    // Leave GHL fields blank until integrated.
  };

  upsertRow(scoreboardPath, isoDate(weekStart), patch);

  console.log(`Updated scoreboard row for week_start_date=${isoDate(weekStart)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
