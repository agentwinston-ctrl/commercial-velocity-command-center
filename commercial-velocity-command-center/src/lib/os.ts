import fs from "node:fs";
import path from "node:path";

function workspacePath(...parts: string[]) {
  // project root is commercial-velocity-command-center, workspace root is one level up
  return path.resolve(process.cwd(), "..", ...parts);
}

function parseCsvLine(line: string): string[] {
  // Minimal CSV: we assume no commas inside fields for our scoreboard.
  return line.split(",");
}

export type ScoreboardRow = Record<string, string>;

export function readLatestScoreboardRow(): ScoreboardRow | null {
  const scoreboardPath = workspacePath(
    "mission-control",
    "operating-system",
    "scoreboard",
    "scoreboard.csv"
  );

  if (!fs.existsSync(scoreboardPath)) return null;
  const raw = fs.readFileSync(scoreboardPath, "utf8").trim();
  if (!raw) return null;

  const lines = raw.split(/\r?\n/);
  if (lines.length < 2) return null;

  const header = parseCsvLine(lines[0]);
  const last = parseCsvLine(lines[lines.length - 1]);

  const row: ScoreboardRow = {};
  for (let i = 0; i < header.length; i++) row[header[i]] = last[i] ?? "";
  return row;
}

export function readThisWeekPriorities(): {
  weekOf?: string;
  priorities: string[];
  todayFocus?: string;
} {
  const p = workspacePath(
    "mission-control",
    "operating-system",
    "weekly",
    "this-week.md"
  );

  if (!fs.existsSync(p)) return { priorities: [] };
  const raw = fs.readFileSync(p, "utf8");

  const lines = raw.split(/\r?\n/);
  const priorities: string[] = [];
  let weekOf: string | undefined;
  let todayFocus: string | undefined;

  for (const line of lines) {
    const mWeek = line.match(/^Week of:\s*(.+)\s*$/i);
    if (mWeek) weekOf = mWeek[1].trim();

    const mPri = line.match(/^\s*\d\)\s*(.+)\s*$/);
    if (mPri) {
      const v = mPri[1].trim();
      if (v) priorities.push(v);
    }

    const mToday = line.match(/^##\s+One thing to attack today\s*$/i);
    if (mToday) {
      // next non-empty line
      const idx = lines.indexOf(line);
      for (let j = idx + 1; j < Math.min(idx + 6, lines.length); j++) {
        const t = lines[j].trim();
        if (t && !t.startsWith("#")) {
          todayFocus = t;
          break;
        }
      }
    }
  }

  return { weekOf, priorities, todayFocus };
}

export function num(row: ScoreboardRow | null, key: string, fallback = 0) {
  if (!row) return fallback;
  const v = Number(row[key]);
  return Number.isFinite(v) ? v : fallback;
}
