import fs from "node:fs";
import path from "node:path";

function todosPath(name: "devon" | "winston") {
  return path.resolve(process.cwd(), "src", "data", "todos", `${name}.md`);
}

export function readTodoDoc(name: "devon" | "winston"): string {
  const p = todosPath(name);
  if (!fs.existsSync(p)) return "(missing)";
  return fs.readFileSync(p, "utf8");
}
