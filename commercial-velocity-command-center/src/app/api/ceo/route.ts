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

// MRR intentionally removed for now. Stripe subscription states (pause vs cancel)
// can inflate MRR and distract from the real North Star.

export async function GET() {
  try {
    const sevenDaysGte = nowUnix() - 7 * 24 * 60 * 60;
    const monthGte = monthStartUnix();

    const [{ net: net7 }, { net: netMtd }] = await Promise.all([
      sumNetChargesSince(sevenDaysGte),
      sumNetChargesSince(monthGte),
    ]);

    return NextResponse.json({
      connected: true,
      cash7d: Math.round(net7 / 100),
      cashMtd: Math.round(netMtd / 100),
      cashTargetMonthly: 150000,
      // Pipeline metrics will be added once GHL automation is wired in.
    });
  } catch (e: any) {
    const msg = e?.message || "Unknown error";
    if (msg === "STRIPE_NOT_CONNECTED") {
      return NextResponse.json({
        connected: false,
        cash7d: 0,
        cashMtd: 0,
        cashTargetMonthly: 150000,
        warning: "Stripe not connected. Add STRIPE_SECRET_KEY in Vercel env vars.",
      });
    }

    return NextResponse.json(
      { connected: true, error: msg },
      { status: 500 }
    );
  }
}
