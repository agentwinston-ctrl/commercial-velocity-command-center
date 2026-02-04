#!/usr/bin/env node
/**
 * Pull Stripe revenue metrics and write to the CRE Operating System scoreboard.
 *
 * Requires: STRIPE_SECRET_KEY in workspace/.env (local only)
 * Output: mission-control/operating-system/scoreboard/scoreboard.csv
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

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

const workspaceDir = process.cwd();
loadDotEnv(path.join(workspaceDir, '.env'));

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error('Missing STRIPE_SECRET_KEY in .env');
  process.exit(1);
}

async function stripeFetch(endpoint, params = {}) {
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
      Authorization: `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Stripe API error ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

async function paginateList(endpoint, baseParams = {}) {
  let starting_after = undefined;
  let out = [];
  while (true) {
    const page = await stripeFetch(endpoint, {
      ...baseParams,
      limit: 100,
      ...(starting_after ? { starting_after } : {}),
    });
    out = out.concat(page.data || []);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  return out;
}

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function mondayStartISO(date = new Date()) {
  // Local timezone. Monday as start of week.
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun..6 Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function pct(n) {
  if (!Number.isFinite(n)) return '';
  return Math.round(n * 1000) / 10; // 0.1%
}

function dollars(cents) {
  return Math.round((cents / 100) * 100) / 100;
}

async function sumNetChargesSince(secondsAgo) {
  const gte = nowUnix() - secondsAgo;
  const charges = await paginateList('/v1/charges', {
    'created[gte]': gte,
  });

  let gross = 0;
  let refunded = 0;
  for (const c of charges) {
    if (!c.paid) continue;
    if (c.status !== 'succeeded') continue;
    // Net of refunds (fees not included)
    gross += c.amount || 0;
    refunded += c.amount_refunded || 0;
  }
  return { gross, refunded, net: gross - refunded, count: charges.length };
}

function monthlyEquivalentFromPrice(price, quantity = 1) {
  if (!price || !price.unit_amount || !price.recurring) return 0;
  const amt = price.unit_amount * quantity;
  const { interval, interval_count } = price.recurring;
  const count = interval_count || 1;

  // Convert to monthly equivalent.
  if (interval === 'month') return amt / count;
  if (interval === 'year') return amt / (12 * count);
  if (interval === 'week') return (amt * 52) / (12 * count);
  if (interval === 'day') return (amt * 365) / (12 * count);
  return 0;
}

async function getMRR() {
  const subs = await paginateList('/v1/subscriptions', {
    status: 'active',
    'expand[]': ['data.items.data.price'],
  });

  let mrrCents = 0;
  for (const s of subs) {
    for (const item of (s.items?.data || [])) {
      mrrCents += monthlyEquivalentFromPrice(item.price, item.quantity || 1);
    }
  }
  return { mrrCents, activeSubs: subs.length };
}

async function getChurn30d(activeSubsCount) {
  // Stripe list subscriptions doesn't support canceled_at filtering reliably across API versions.
  // Pull canceled subs and filter client-side.
  const since = nowUnix() - 30 * 24 * 60 * 60;
  const canceled = await paginateList('/v1/subscriptions', { status: 'canceled' });
  const recentCanceled = canceled.filter((s) => (s.canceled_at || 0) >= since);

  const canceledCount = recentCanceled.length;
  const denom = activeSubsCount + canceledCount;
  const churn = denom > 0 ? canceledCount / denom : 0;
  return { churn, canceledCount };
}

function readCSV(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

function writeCSV(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function upsertScoreboardRow(csv, weekStart, patch) {
  const lines = csv.trimEnd().split(/\r?\n/);
  if (lines.length === 0) throw new Error('scoreboard.csv is empty');
  const header = lines[0];
  const rows = lines.slice(1);

  const cols = header.split(',');
  const colIndex = Object.fromEntries(cols.map((c, i) => [c, i]));
  const makeRow = () => {
    const row = new Array(cols.length).fill('');
    row[colIndex.date_week_start] = weekStart;
    for (const [k, v] of Object.entries(patch)) {
      if (!(k in colIndex)) continue;
      row[colIndex[k]] = String(v ?? '');
    }
    return row.join(',');
  };

  // Find existing row
  let foundIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const first = rows[i].split(',')[0];
    if (first === weekStart) { foundIdx = i; break; }
  }

  if (foundIdx >= 0) rows[foundIdx] = makeRow();
  else rows.push(makeRow());

  return [header, ...rows].join('\n') + '\n';
}

async function main() {
  const sevenDays = 7 * 24 * 60 * 60;
  const thirtyDays = 30 * 24 * 60 * 60;

  const weekStart = mondayStartISO();

  const [{ net: net7 }, { net: net30 }] = await Promise.all([
    sumNetChargesSince(sevenDays),
    sumNetChargesSince(thirtyDays),
  ]);

  const { mrrCents, activeSubs } = await getMRR();
  const { churn } = await getChurn30d(activeSubs);

  const scoreboardPath = path.join(workspaceDir, 'mission-control/operating-system/scoreboard/scoreboard.csv');
  const current = readCSV(scoreboardPath);

  const next = upsertScoreboardRow(current, weekStart, {
    cash_collected_7d: dollars(net7),
    cash_collected_30d: dollars(net30),
    mrr: dollars(mrrCents),
    churn_pct_30d: pct(churn),
    active_clients: activeSubs,
    notes: `Stripe automated ${new Date().toISOString().slice(0,10)}`,
  });

  writeCSV(scoreboardPath, next);
  console.log(`Updated scoreboard for week ${weekStart}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
