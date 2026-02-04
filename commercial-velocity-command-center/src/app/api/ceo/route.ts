import { NextResponse } from "next/server";

async function stripeFetch(endpoint: string, params: Record<string, string | number | undefined> = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_NOT_CONNECTED");

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

async function sumNetChargesSince(unixGte: number) {
  const charges = await paginate("/v1/charges", { "created[gte]": unixGte });

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

  // activeClients here means active subscriptions count (what Devon wants to see).
  return { mrrCents, activeSubs: subs.length, newClientsMtd };
}

async function churnPct30d(activeSubs: number) {
  const since = nowUnix() - 30 * 24 * 60 * 60;
  const canceled = await paginate("/v1/subscriptions", { status: "canceled" });
  const recentCanceled = canceled.filter((s) => (s.canceled_at || 0) >= since);
  const canceledCount = recentCanceled.length;
  const denom = activeSubs + canceledCount;
  const churn = denom > 0 ? canceledCount / denom : 0;
  return churn * 100;
}

export async function GET() {
  try {
    const sevenDaysGte = nowUnix() - 7 * 24 * 60 * 60;
    const monthGte = monthStartUnix();

    const [{ net: net7 }, { net: netMtd }, mrr] = await Promise.all([
      sumNetChargesSince(sevenDaysGte),
      sumNetChargesSince(monthGte),
      getMRR(),
    ]);

    const churn30 = await churnPct30d(mrr.activeSubs);

    return NextResponse.json({
      connected: true,
      mrr: Math.round(mrr.mrrCents / 100),
      mrrTarget: 100000,
      cash7d: Math.round(net7 / 100),
      cashMtd: Math.round(netMtd / 100),
      churn30dPct: Math.round(churn30 * 10) / 10,
      activeSubs: mrr.activeSubs,
      newSubsMtd: mrr.newClientsMtd,
      // Pipeline metrics will be added once GHL automation is wired in.
    });
  } catch (e: any) {
    const msg = e?.message || "Unknown error";
    if (msg === "STRIPE_NOT_CONNECTED") {
      return NextResponse.json({
        connected: false,
        mrr: 0,
        mrrTarget: 100000,
        cash7d: 0,
        cashMtd: 0,
        churn30dPct: 0,
        activeSubs: 0,
        newSubsMtd: 0,
        warning: "Stripe not connected. Add STRIPE_SECRET_KEY in Vercel env vars.",
      });
    }

    return NextResponse.json(
      { connected: true, error: msg },
      { status: 500 }
    );
  }
}
