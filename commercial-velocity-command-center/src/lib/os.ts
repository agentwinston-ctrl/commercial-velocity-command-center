import fs from "node:fs";
import path from "node:path";

function dataPath(...parts: string[]) {
  // Keep weekly priorities inside the app repo so Vercel can read it.
  return path.resolve(process.cwd(), "src", "data", ...parts);
}

export function readThisWeekPriorities(): {
  weekOf?: string;
  priorities: string[];
  todayFocus?: string;
} {
  const p = dataPath("this-week.md");
  if (!fs.existsSync(p)) return { priorities: [] };

  const raw = fs.readFileSync(p, "utf8");
  const lines = raw.split(/\r?\n/);

  const priorities: string[] = [];
  let weekOf: string | undefined;
  let todayFocus: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const mWeek = line.match(/^Week of:\s*(.+)\s*$/i);
    if (mWeek) weekOf = mWeek[1].trim();

    const mPri = line.match(/^\s*\d\)\s*(.+)\s*$/);
    if (mPri) {
      const v = mPri[1].trim();
      if (v) priorities.push(v);
    }

    if (/^##\s+One thing to attack today\s*$/i.test(line.trim())) {
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
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
