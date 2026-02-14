import fs from "node:fs";
import path from "node:path";

export type ScoreboardRow = Record<string, string>;

function scoreboardPath() {
  // Scoreboard lives outside app root but build setting allows including outside root.
  return path.resolve(process.cwd(), "..", "mission-control", "operating-system", "scoreboard", "scoreboard.csv");
}

export function readScoreboardCSV(): { header: string[]; rows: ScoreboardRow[] } {
  const p = scoreboardPath();
  if (!fs.existsSync(p)) return { header: [], rows: [] };

  const raw = fs.readFileSync(p, "utf8").trimEnd();
  if (!raw) return { header: [], rows: [] };

  const lines = raw.split(/\r?\n/);
  const header = lines[0].split(",").map((s) => s.trim());

  const rows: ScoreboardRow[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const parts = line.split(",");
    const row: ScoreboardRow = {};
    for (let i = 0; i < header.length; i++) row[header[i]] = (parts[i] ?? "").trim();
    rows.push(row);
  }

  return { header, rows };
}

export function getLatestWeeks(n = 8): ScoreboardRow[] {
  const { rows } = readScoreboardCSV();
  const sorted = [...rows].sort((a, b) => (a.week_start_date || "").localeCompare(b.week_start_date || ""));
  return sorted.slice(Math.max(0, sorted.length - n));
}

export function getLastWeekRow(now = new Date()): ScoreboardRow | null {
  const { rows } = readScoreboardCSV();
  if (!rows.length) return null;

  // most recent Monday before today
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(d);
  thisMonday.setDate(thisMonday.getDate() + diffToMonday);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const key = lastMonday.toISOString().slice(0, 10);

  const hit = rows.find((r) => (r.week_start_date || "") === key);
  if (hit) return hit;

  // fallback: use latest row strictly before thisMonday
  const sorted = [...rows].sort((a, b) => (a.week_start_date || "").localeCompare(b.week_start_date || ""));
  const prior = sorted.filter((r) => (r.week_start_date || "") < thisMonday.toISOString().slice(0, 10));
  return prior.length ? prior[prior.length - 1] : sorted[sorted.length - 1];
}

export function num(v: string | undefined): number | null {
  if (v === undefined) return null;
  const t = String(v).trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
