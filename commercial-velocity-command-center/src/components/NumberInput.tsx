"use client";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  step?: number;
};

export default function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  step = 1,
}: Props) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        {prefix ? <span className="text-sm text-slate-400">{prefix}</span> : null}
        <input
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value || 0))}
        />
        {suffix ? <span className="text-sm text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}
