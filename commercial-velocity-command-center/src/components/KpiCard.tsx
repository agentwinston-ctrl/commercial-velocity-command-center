type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
};

export default function KpiCard({ label, value, hint, tone = "neutral" }: Props) {
  const toneClass =
    tone === "good"
      ? "border-[color:color-mix(in_oklab,var(--good),transparent_75%)] bg-[color:color-mix(in_oklab,var(--good),transparent_92%)]"
      : tone === "warn"
      ? "border-[color:color-mix(in_oklab,var(--warn),transparent_75%)] bg-[color:color-mix(in_oklab,var(--warn),transparent_92%)]"
      : tone === "bad"
      ? "border-[color:color-mix(in_oklab,var(--bad),transparent_75%)] bg-[color:color-mix(in_oklab,var(--bad),transparent_92%)]"
      : "border-[var(--border)] bg-[var(--panel)]";

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="text-sm text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs text-[var(--muted2)]">{hint}</div> : null}
    </div>
  );
}
