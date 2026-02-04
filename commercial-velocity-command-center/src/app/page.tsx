import RuleOf100Card from "@/components/RuleOf100Card";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Commercial Velocity Command Center
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Operator OS. One screen. No excuses.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <RuleOf100Card />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="text-sm text-slate-300">CFA Scoreboard</div>
            <div className="mt-2 text-lg font-medium">Coming next</div>
            <p className="mt-2 text-sm text-slate-400">
              30 day cash collected ÷ acquisition cost.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="text-sm text-slate-300">Leakage Calculator</div>
            <div className="mt-2 text-lg font-medium">Coming next</div>
            <p className="mt-2 text-sm text-slate-400">
              Sales tool to quantify lost revenue.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="text-sm text-slate-300">Kill Switch</div>
            <div className="mt-2 text-lg font-medium">Coming next</div>
            <p className="mt-2 text-sm text-slate-400">
              Toggle Pilot clients on or off.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
