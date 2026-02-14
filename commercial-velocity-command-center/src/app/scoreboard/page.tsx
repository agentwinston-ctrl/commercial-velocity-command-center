import { getLatestWeeks, readScoreboardCSV } from "@/lib/scoreboard";

export default function ScoreboardPage() {
  const { header } = readScoreboardCSV();
  const weeks = getLatestWeeks(8);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scoreboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Raw weekly metrics. This is what the constraint engine reads. Last 8 weeks.
        </p>
      </div>

      {!header.length ? (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm">
          Scoreboard not found.
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <table className="min-w-[900px] w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {header.map((h) => (
                <th key={h} className="px-3 py-2 text-[var(--muted2)] font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((row, idx) => (
              <tr key={idx} className="border-b border-[var(--border)] last:border-b-0">
                {header.map((h) => (
                  <td key={h} className="px-3 py-2 text-[var(--text)] font-mono">
                    {row[h] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
        Next: a constraint view that interprets thresholds. Also a data-quality panel.
      </div>
    </div>
  );
}
