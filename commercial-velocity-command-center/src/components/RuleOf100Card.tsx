"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cvcc.ruleOf100.count";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function RuleOf100Card() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const n = Number(raw);
    if (Number.isFinite(n)) setCount(clamp(n, 0, 1000));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(count));
  }, [count]);

  const pct = useMemo(() => clamp((count / 100) * 100, 0, 100), [count]);
  const status = count >= 100 ? "GREEN" : "RED";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-300">Rule of 100</div>
          <div className="mt-1 text-lg font-semibold">Daily Volume</div>
        </div>
        <div
          className={
            "rounded-full px-3 py-1 text-xs font-semibold " +
            (status === "GREEN"
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/15 text-rose-300 border border-rose-500/30")
          }
        >
          {status}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-300">Progress</div>
          <div className="font-mono text-slate-200">{count}/100</div>
        </div>

        <div className="mt-2 h-3 w-full rounded-full bg-slate-800">
          <div
            className={
              "h-3 rounded-full transition-all " +
              (status === "GREEN" ? "bg-emerald-500" : "bg-rose-500")
            }
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
            type="number"
            min={0}
            max={1000}
            value={count}
            onChange={(e) => setCount(clamp(Number(e.target.value || 0), 0, 1000))}
          />
          <button
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => setCount(0)}
          >
            Reset
          </button>

          <div className="ml-auto text-xs text-slate-400">
            Volume negates luck.
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Count this however you want (DMs, calls, ad spend actions). The only
          rule: hit 100.
        </p>
      </div>
    </div>
  );
}
