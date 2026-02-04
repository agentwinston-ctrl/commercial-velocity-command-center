import { NextResponse } from "next/server";

async function stripeFetch(endpoint: string, params: Record<string, string | number | undefined> = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

  const url = new URL(`https://api.stripe.com${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    // stripe requires no caching for live metrics
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Stripe API error ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

async function paginate(endpoint: string, params: Record<string, any>) {
  let starting_after: string | undefined;
  let out: any[] = [];
  while (true) {
    const page = await stripeFetch(endpoint, {
      ...params,
      limit: 100,
      ...(starting_after ? { starting_after } : {}),
    });
    out = out.concat(page.data || []);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1]?.id;
  }
  return out;
}

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function monthStartUnix() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function monthlyEquivalent(price: any, quantity: number) {
  if (!price?.unit_amount || !price?.recurring) return 0;
  const amt = price.unit_amount * quantity;
  const interval = price.recurring.interval;
  const count = price.recurring.interval_count || 1;

  if (interval === "month") return amt / count;
  if (interval === "year") return amt / (12 * count);
  if (interval === "week") return (amt * 52) / (12 * count);
  if (interval === "day") return (amt * 365) / (12 * count);
  return 0;
}

async function sumNetChargesSince(secondsAgo: number) {
  const gte = nowUnix() - secondsAgo;
  const charges = await paginate("/v1/charges", { "created[gte]": gte });

  let gross = 0;
  let refunded = 0;
  for (const c of charges) {
    if (!c.paid) continue;
    if (c.status !== "succeeded") continue;
    gross += c.amount || 0;
    refunded += c.amount_refunded || 0;
  }

  return { net: gross - refunded };
}

async function getMRR() {
  const subs = await paginate("/v1/subscriptions", {
    status: "active",
    "expand[]": "data.items.data.price",
  });

  let mrrCents = 0;
  for (const s of subs) {
    for (const item of s.items?.data || []) {
      mrrCents += monthlyEquivalent(item.price, item.quantity || 1);
    }
  }

  const mStart = monthStartUnix();
  const newClientsMtd = subs.filter((s) => (s.created || 0) >= mStart).length;

  return { mrrCents, activeClients: subs.length, newClientsMtd };
}

async function churnPct30d(activeClients: number) {
  const since = nowUnix() - 30 * 24 * 60 * 60;
  const canceled = await paginate("/v1/subscriptions", { status: "canceled" });
  const recentCanceled = canceled.filter((s) => (s.canceled_at || 0) >= since);
  const canceledCount = recentCanceled.length;
  const denom = activeClients + canceledCount;
  const churn = denom > 0 ? canceledCount / denom : 0;
  return churn * 100;
}

export async function GET() {
  try {
    const sevenDays = 7 * 24 * 60 * 60;
    const thirtyDays = 30 * 24 * 60 * 60;

    const [{ net: net7 }, { net: net30 }, mrr] = await Promise.all([
      sumNetChargesSince(sevenDays),
      sumNetChargesSince(thirtyDays),
      getMRR(),
    ]);

    const churn30 = await churnPct30d(mrr.activeClients);

    return NextResponse.json({
      mrr: Math.round(mrr.mrrCents / 100),
      mrrTarget: 100000,
      cash7d: Math.round(net7 / 100),
      cash30d: Math.round(net30 / 100),
      churn30dPct: Math.round(churn30 * 10) / 10,
      activeClients: mrr.activeClients,
      newClientsMtd: mrr.newClientsMtd,
      // Pipeline metrics will be added once GHL automation is wired in.
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
