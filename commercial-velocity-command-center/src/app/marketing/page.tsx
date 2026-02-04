import RuleOf100Card from "@/components/RuleOf100Card";

export default function MarketingPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
      <p className="mt-1 text-sm text-slate-300">Inputs. Volume. No excuses.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <RuleOf100Card />
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm text-slate-300">Core Four</div>
          <div className="mt-2 text-lg font-semibold">Focus</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Cold DMs (Rule of 100)</li>
            <li>Paid Ads (Leakage Audit)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
