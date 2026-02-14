#!/usr/bin/env node
/**
 * Stripe-only 8-week backfill for the CRE scoreboard.
 * Writes 8 weekly rows ending with the current week.
 *
 * - Uses timestamp logic only for subscription activity at time T.
 * - Dedupe by Stripe customer (1 customer = 1 client).
 * - Churn = subscription canceled (canceled_at set). Paused/past_due/unpaid are at risk.
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

function computeStripeMetrics({ subsAll, windowStart, windowEnd, monthStartTs, rolling30Start, rolling30End }) {
  const activeAtMonthStart = listToCustomerSet(subsAll.filter((s) => isActiveAt(s, monthStartTs)));

  const churnedMtd = new Set();
  for (const s of subsAll) {
    const ca = s?.canceled_at;
    if (!ca) continue;
    if (!isActiveAt(s, monthStartTs)) continue;
    if (inWindow(ca, monthStartTs, windowEnd)) churnedMtd.add(String(s.customer));
  }

  const activeAtRollingStart = listToCustomerSet(subsAll.filter((s) => isActiveAt(s, rolling30Start)));
  const churned30 = new Set();
  for (const s of subsAll) {
    const ca = s?.canceled_at;
    if (!ca) continue;
    const cust = String(s.customer);
    if (!activeAtRollingStart.has(cust)) continue;
    if (inWindow(ca, rolling30Start, rolling30End)) churned30.add(cust);
  }
  const churnPct30 = activeAtRollingStart.size > 0 ? (churned30.size / activeAtRollingStart.size) * 100 : 0;

  const atRisk = new Set();
  for (const s of subsAll) {
    if (!isActiveAt(s, windowEnd - 1)) continue;
    const paused = !!s.pause_collection;
    const status = String(s.status || '').toLowerCase();
    const pastDueOrUnpaid = status === 'past_due' || status === 'unpaid';
    if (paused || pastDueOrUnpaid) atRisk.add(String(s.customer));
  }

  return {
    clients_active_start_of_month_count: activeAtMonthStart.size,
    clients_churned_mtd_count: churnedMtd.size,
    churn_pct_30d_logo: pct(churnPct30),
    clients_at_risk_count: atRisk.size,
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

  const bak = `${csvPath}.bak.${Date.now()}`;
  fs.copyFileSync(csvPath, bak);

  fs.writeFileSync(csvPath, EXPECTED_COLS.join(',') + '\n', 'utf8');
  console.log(`Rewrote scoreboard header (backup at ${bak})`);
}

function readRows(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.trimEnd().split(/\r?\n/);
  const header = lines[0];
  const rows = lines.slice(1).filter(Boolean);
  return { header, rows };
}

function writeRows(csvPath, header, rows) {
  fs.writeFileSync(csvPath, [header, ...rows].join('\n') + '\n', 'utf8');
}

function upsertRow(rows, weekStartISO, patch) {
  const cols = EXPECTED_COLS;
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
  const next = rows.map((r) => {
    const first = r.split(',')[0];
    if (first === weekStartISO) {
      found = true;
      return make();
    }
    return r;
  });
  if (!found) next.push(make());

  // Sort by week_start_date ascending
  next.sort((a, b) => a.split(',')[0].localeCompare(b.split(',')[0]));
  return next;
}

async function main() {
  const workspaceDir = process.cwd();
  loadDotEnv(path.join(workspaceDir, '.env'));

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('Missing STRIPE_SECRET_KEY in workspace/.env');
    process.exit(1);
  }

  const scoreboardPath = path.join(workspaceDir, 'mission-control/operating-system/scoreboard/scoreboard.csv');
  ensureScoreboard(scoreboardPath);

  const { header, rows: existingRows } = readRows(scoreboardPath);

  // Pull subscriptions once for all 8 weeks (timestamp logic applied per-window).
  const subsAll = await paginateStripeList('/v1/subscriptions', { status: 'all' }, stripeKey);

  let rows = existingRows;

  const thisWeekStart = mondayStartLocal();

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(thisWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const windowStart = unix(weekStart);
    const windowEnd = unix(weekEnd);

    const monthStart = monthStartLocal(weekStart);
    const monthStartTs = unix(monthStart);

    const rolling30End = windowEnd;
    const rolling30Start = rolling30End - 30 * 24 * 60 * 60;

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
    };

    rows = upsertRow(rows, isoDate(weekStart), patch);
    console.log(`Backfilled week_start_date=${isoDate(weekStart)}`);
  }

  writeRows(scoreboardPath, header, rows);
  console.log('Backfill complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
