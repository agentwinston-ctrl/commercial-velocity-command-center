"use client";

import { useEffect, useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import NumberInput from "@/components/NumberInput";
import { getNumber, setNumber } from "@/components/storage";

const base = "cvcc.sales";

type Scope = "weekly" | "quarterly";

const keys = (scope: Scope) => ({
  callsScheduled: `${base}.${scope}.callsScheduled`,
  liveCalls: `${base}.${scope}.liveCalls`,
  offers: `${base}.${scope}.offers`,
  closed: `${base}.${scope}.closed`,
  pifs: `${base}.${scope}.pifs`,
  splitPays: `${base}.${scope}.splitPays`,
  deposits: `${base}.${scope}.deposits`,
  depositTotal: `${base}.${scope}.depositTotal`,
  fuCalls: `${base}.${scope}.fuCalls`,
  cashCollected: `${base}.${scope}.cashCollected`,
  contractValue: `${base}.${scope}.contractValue`,
});

function pct(n: number) {
  return (n * 100).toFixed(0) + "%";
}

export default function SalesPage() {
  const [scope, setScope] = useState<Scope>("weekly");

  const [callsScheduled, setCallsScheduled] = useState(0);
  const [liveCalls, setLiveCalls] = useState(0);
  const [offers, setOffers] = useState(0);
  const [closed, setClosed] = useState(0);
  const [pifs, setPifs] = useState(0);
  const [splitPays, setSplitPays] = useState(0);
  const [deposits, setDeposits] = useState(0);
  const [depositTotal, setDepositTotal] = useState(0);
  const [fuCalls, setFuCalls] = useState(0);
  const [cashCollected, setCashCollected] = useState(0);
  const [contractValue, setContractValue] = useState(0);

  useEffect(() => {
    const k = keys(scope);
    setCallsScheduled(getNumber(k.callsScheduled, 0));
    setLiveCalls(getNumber(k.liveCalls, 0));
    setOffers(getNumber(k.offers, 0));
    setClosed(getNumber(k.closed, 0));
    setPifs(getNumber(k.pifs, 0));
    setSplitPays(getNumber(k.splitPays, 0));
    setDeposits(getNumber(k.deposits, 0));
    setDepositTotal(getNumber(k.depositTotal, 0));
    setFuCalls(getNumber(k.fuCalls, 0));
    setCashCollected(getNumber(k.cashCollected, 0));
    setContractValue(getNumber(k.contractValue, 0));
  }, [scope]);

  useEffect(() => setNumber(keys(scope).callsScheduled, callsScheduled), [scope, callsScheduled]);
  useEffect(() => setNumber(keys(scope).liveCalls, liveCalls), [scope, liveCalls]);
  useEffect(() => setNumber(keys(scope).offers, offers), [scope, offers]);
  useEffect(() => setNumber(keys(scope).closed, closed), [scope, closed]);
  useEffect(() => setNumber(keys(scope).pifs, pifs), [scope, pifs]);
  useEffect(() => setNumber(keys(scope).splitPays, splitPays), [scope, splitPays]);
  useEffect(() => setNumber(keys(scope).deposits, deposits), [scope, deposits]);
  useEffect(() => setNumber(keys(scope).depositTotal, depositTotal), [scope, depositTotal]);
  useEffect(() => setNumber(keys(scope).fuCalls, fuCalls), [scope, fuCalls]);
  useEffect(() => setNumber(keys(scope).cashCollected, cashCollected), [scope, cashCollected]);
  useEffect(() => setNumber(keys(scope).contractValue, contractValue), [scope, contractValue]);

  const showRate = useMemo(() => {
    if (callsScheduled <= 0) return 0;
    return liveCalls / callsScheduled;
  }, [liveCalls, callsScheduled]);

  const offerRate = useMemo(() => {
    if (liveCalls <= 0) return 0;
    return offers / liveCalls;
  }, [offers, liveCalls]);

  const closeRate = useMemo(() => {
    if (liveCalls <= 0) return 0;
    return closed / liveCalls;
  }, [closed, liveCalls]);

  const offerCloseRate = useMemo(() => {
    if (offers <= 0) return 0;
    return closed / offers;
  }, [closed, offers]);

  const cashPerCall = useMemo(() => {
    if (liveCalls <= 0) return 0;
    return cashCollected / liveCalls;
  }, [cashCollected, liveCalls]);

  const revenuePerCall = useMemo(() => {
    if (liveCalls <= 0) return 0;
    return contractValue / liveCalls;
  }, [contractValue, liveCalls]);

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="mt-1 text-sm text-slate-300">Track the chain. Fix the constraint.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={
              "rounded-lg border px-3 py-2 text-sm " +
              (scope === "weekly"
                ? "border-slate-700 bg-slate-900 text-slate-50"
                : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900")
            }
            onClick={() => setScope("weekly")}
          >
            Weekly
          </button>
          <button
            className={
              "rounded-lg border px-3 py-2 text-sm " +
              (scope === "quarterly"
                ? "border-slate-700 bg-slate-900 text-slate-50"
                : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900")
            }
            onClick={() => setScope("quarterly")}
          >
            Quarterly
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Calls Scheduled" value={String(callsScheduled)} />
        <KpiCard label="Show %" value={pct(showRate)} tone={showRate >= 0.7 ? "good" : showRate >= 0.5 ? "warn" : "bad"} />
        <KpiCard label="Offer %" value={pct(offerRate)} tone={offerRate >= 0.6 ? "good" : offerRate >= 0.4 ? "warn" : "bad"} />
        <KpiCard label="Close %" value={pct(closeRate)} tone={closeRate >= 0.25 ? "good" : closeRate >= 0.15 ? "warn" : "bad"} />
        <KpiCard label="Offer Close %" value={pct(offerCloseRate)} tone={offerCloseRate >= 0.4 ? "good" : offerCloseRate >= 0.25 ? "warn" : "bad"} />
        <KpiCard label="Cash Collected" value={`$${cashCollected.toLocaleString()}`} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold">Inputs (manual)</div>
          <div className="mt-4 space-y-3">
            <NumberInput label="Calls Scheduled" value={callsScheduled} onChange={setCallsScheduled} />
            <NumberInput label="Live Calls" value={liveCalls} onChange={setLiveCalls} />
            <NumberInput label="Offers" value={offers} onChange={setOffers} />
            <NumberInput label="Closed" value={closed} onChange={setClosed} />
            <NumberInput label="Follow-up Calls" value={fuCalls} onChange={setFuCalls} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold">Collections</div>
          <div className="mt-4 space-y-3">
            <NumberInput label="PIFs" value={pifs} onChange={setPifs} />
            <NumberInput label="Split Pays" value={splitPays} onChange={setSplitPays} />
            <NumberInput label="Deposits" value={deposits} onChange={setDeposits} />
            <NumberInput label="Deposit Total" value={depositTotal} onChange={setDepositTotal} prefix="$" step={100} />
            <NumberInput label="Cash Collected" value={cashCollected} onChange={setCashCollected} prefix="$" step={100} />
            <NumberInput label="Contract Value" value={contractValue} onChange={setContractValue} prefix="$" step={100} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <KpiCard label="Cash / Call" value={`$${Math.round(cashPerCall).toLocaleString()}`} />
            <KpiCard label="Revenue / Call" value={`$${Math.round(revenuePerCall).toLocaleString()}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
