"use client";

import { useEffect, useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import NumberInput from "@/components/NumberInput";
import { getNumber, setNumber } from "@/components/storage";

const KEYS = {
  cash30: "cvcc.finance.cash30",
  adspend30: "cvcc.finance.adspend30",
  trials30: "cvcc.finance.trials30",
  setup30: "cvcc.finance.setup30",
  apptFees30: "cvcc.finance.apptFees30",
};

export default function FinancePage() {
  const [cash30, setCash30] = useState(0);
  const [adspend30, setAdspend30] = useState(0);
  const [trials30, setTrials30] = useState(0);
  const [setup30, setSetup30] = useState(0);
  const [apptFees30, setApptFees30] = useState(0);

  useEffect(() => {
    setCash30(getNumber(KEYS.cash30, 0));
    setAdspend30(getNumber(KEYS.adspend30, 0));
    setTrials30(getNumber(KEYS.trials30, 0));
    setSetup30(getNumber(KEYS.setup30, 0));
    setApptFees30(getNumber(KEYS.apptFees30, 0));
  }, []);

  useEffect(() => setNumber(KEYS.cash30, cash30), [cash30]);
  useEffect(() => setNumber(KEYS.adspend30, adspend30), [adspend30]);
  useEffect(() => setNumber(KEYS.trials30, trials30), [trials30]);
  useEffect(() => setNumber(KEYS.setup30, setup30), [setup30]);
  useEffect(() => setNumber(KEYS.apptFees30, apptFees30), [apptFees30]);

  const cfa = useMemo(() => {
    if (adspend30 <= 0) return cash30 > 0 ? 999 : 0;
    return cash30 / adspend30;
  }, [cash30, adspend30]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
      <p className="mt-1 text-sm text-slate-300">Cash discipline. Free tier. No fluff.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Cash Collected (30D)"
          value={`$${cash30.toLocaleString()}`}
          tone={cfa >= 2 ? "good" : cfa >= 1 ? "warn" : "bad"}
        />
        <KpiCard label="Ad Spend (30D)" value={`$${adspend30.toLocaleString()}`} />
        <KpiCard
          label="CFA Ratio"
          value={cfa === 999 ? "∞" : cfa.toFixed(2) + ":1"}
          tone={cfa >= 2 ? "good" : cfa >= 1 ? "warn" : "bad"}
          hint="Target 2:1+. Red under 1:1."
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold">Inputs (manual)</div>
          <div className="mt-4 space-y-3">
            <NumberInput label="Cash collected (30D)" value={cash30} onChange={setCash30} prefix="$" step={100} />
            <NumberInput label="Ad spend (30D)" value={adspend30} onChange={setAdspend30} prefix="$" step={50} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold">Breakdown (30D)</div>
          <div className="mt-4 space-y-3">
            <NumberInput label="Paid trials collected" value={trials30} onChange={setTrials30} prefix="$" step={100} />
            <NumberInput label="$8k setups collected" value={setup30} onChange={setSetup30} prefix="$" step={100} />
            <NumberInput label="Appointment fees collected" value={apptFees30} onChange={setApptFees30} prefix="$" step={100} />
          </div>
        </div>
      </div>
    </div>
  );
}
