"use client";

import { useEffect, useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import NumberInput from "@/components/NumberInput";
import { getNumber, setNumber } from "@/components/storage";

const KEYS = {
  cash30: "cvcc.ceo.cash30",
  profitQtd: "cvcc.ceo.profitQtd",
  adspend30: "cvcc.ceo.adspend30",
  leadsWk: "cvcc.ceo.leadsWk",
  bookedWk: "cvcc.ceo.bookedWk",
  showedWk: "cvcc.ceo.showedWk",
};

export default function CEOPage() {
  const [cash30, setCash30] = useState(0);
  const [profitQtd, setProfitQtd] = useState(0);
  const [adspend30, setAdspend30] = useState(0);
  const [leadsWk, setLeadsWk] = useState(0);
  const [bookedWk, setBookedWk] = useState(0);
  const [showedWk, setShowedWk] = useState(0);

  useEffect(() => {
    setCash30(getNumber(KEYS.cash30, 0));
    setProfitQtd(getNumber(KEYS.profitQtd, 0));
    setAdspend30(getNumber(KEYS.adspend30, 0));
    setLeadsWk(getNumber(KEYS.leadsWk, 0));
    setBookedWk(getNumber(KEYS.bookedWk, 0));
    setShowedWk(getNumber(KEYS.showedWk, 0));
  }, []);

  useEffect(() => setNumber(KEYS.cash30, cash30), [cash30]);
  useEffect(() => setNumber(KEYS.profitQtd, profitQtd), [profitQtd]);
  useEffect(() => setNumber(KEYS.adspend30, adspend30), [adspend30]);
  useEffect(() => setNumber(KEYS.leadsWk, leadsWk), [leadsWk]);
  useEffect(() => setNumber(KEYS.bookedWk, bookedWk), [bookedWk]);
  useEffect(() => setNumber(KEYS.showedWk, showedWk), [showedWk]);

  const bookingRate = useMemo(() => {
    if (leadsWk <= 0) return 0;
    return bookedWk / leadsWk;
  }, [bookedWk, leadsWk]);

  const showRate = useMemo(() => {
    if (bookedWk <= 0) return 0;
    return showedWk / bookedWk;
  }, [showedWk, bookedWk]);

  const cfa = useMemo(() => {
    if (adspend30 <= 0) return cash30 > 0 ? 999 : 0;
    return cash30 / adspend30;
  }, [cash30, adspend30]);

  const bottleneck = useMemo(() => {
    if (leadsWk < 10) return "Leads";
    if (bookingRate < 0.2) return "Booking";
    if (showRate < 0.7) return "Show Up";
    return "None";
  }, [leadsWk, bookingRate, showRate]);

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CEO</h1>
          <p className="mt-1 text-sm text-slate-300">
            North Star: cash collected. Everything else supports it.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Cash Collected (30D)"
          value={`$${cash30.toLocaleString()}`}
          tone={cfa >= 2 ? "good" : cfa >= 1 ? "warn" : "bad"}
          hint="Scoreboard. No cope."
        />

        <KpiCard
          label="CFA Ratio (30D)"
          value={cfa === 999 ? "∞" : cfa.toFixed(2) + ":1"}
          tone={cfa >= 2 ? "good" : cfa >= 1 ? "warn" : "bad"}
          hint="Cash collected ÷ ad spend. Target 2:1+."
        />

        <KpiCard
          label="QTD Profit Goal"
          value={`$${profitQtd.toLocaleString()} / $100,000`}
          tone={profitQtd >= 100000 ? "good" : profitQtd >= 50000 ? "warn" : "bad"}
          hint="Quarter to date net profit."
        />

        <KpiCard
          label="Leads (This Week)"
          value={String(leadsWk)}
          tone={leadsWk >= 25 ? "good" : leadsWk >= 10 ? "warn" : "bad"}
        />

        <KpiCard
          label="Booking Rate"
          value={(bookingRate * 100).toFixed(0) + "%"}
          tone={bookingRate >= 0.25 ? "good" : bookingRate >= 0.15 ? "warn" : "bad"}
          hint="Lead → booked estimate"
        />

        <KpiCard
          label="Show Up Rate"
          value={(showRate * 100).toFixed(0) + "%"}
          tone={showRate >= 0.75 ? "good" : showRate >= 0.6 ? "warn" : "bad"}
          hint="Booked → showed"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm text-slate-300">Today’s constraint</div>
        <div className="mt-1 text-xl font-semibold">
          {bottleneck === "None" ? "Keep volume. Don’t get cute." : bottleneck}
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Diagnose before prescribe. Fix the bottleneck, then scale.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold">Inputs (manual)</div>
          <p className="mt-1 text-sm text-slate-400">
            Manual on purpose. Data → insight.
          </p>

          <div className="mt-4 space-y-3">
            <NumberInput label="Cash collected (30D)" value={cash30} onChange={setCash30} prefix="$" step={100} />
            <NumberInput label="Ad spend (30D)" value={adspend30} onChange={setAdspend30} prefix="$" step={50} />
            <NumberInput label="Profit QTD" value={profitQtd} onChange={setProfitQtd} prefix="$" step={100} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold">Weekly delivery</div>
          <p className="mt-1 text-sm text-slate-400">These drive retention.</p>

          <div className="mt-4 space-y-3">
            <NumberInput label="Leads (this week)" value={leadsWk} onChange={setLeadsWk} />
            <NumberInput label="Booked estimates (this week)" value={bookedWk} onChange={setBookedWk} />
            <NumberInput label="Showed (this week)" value={showedWk} onChange={setShowedWk} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold">Rules</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>1) Cash collected is the scoreboard.</li>
            <li>2) If CFA &lt; 1:1, fix the offer or close.</li>
            <li>3) If delivery drops, churn is next.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
