type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
};

export default function KpiCard({ label, value, hint, tone = "neutral" }: Props) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/25 bg-emerald-500/5"
      : tone === "warn"
      ? "border-amber-500/25 bg-amber-500/5"
      : tone === "bad"
      ? "border-rose-500/25 bg-rose-500/5"
      : "border-slate-800 bg-slate-900/40";

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="text-sm text-slate-300">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}
