import fs from "node:fs";
import path from "node:path";

function agentOsPath(...parts: string[]) {
  return path.resolve(process.cwd(), "src", "data", "agent-os", ...parts);
}

export type AgentOsDoc = {
  id: string;
  title: string;
  filename: string;
};

export const AGENT_OS_DOCS: AgentOsDoc[] = [
  { id: "identity", title: "IDENTITY", filename: "IDENTITY.md" },
  { id: "user", title: "USER", filename: "USER.md" },
  { id: "soul", title: "SOUL", filename: "SOUL.md" },
  { id: "heartbeat", title: "HEARTBEAT", filename: "HEARTBEAT.md" },
  { id: "memory", title: "MEMORY", filename: "MEMORY.md" },
  { id: "agents", title: "AGENTS", filename: "AGENTS.md" },
  { id: "tools", title: "TOOLS", filename: "TOOLS.md" },
  { id: "goals", title: "GOALS", filename: "goals.md" },
  { id: "activity", title: "ACTIVITY LOG", filename: "activity-log.md" },
  { id: "working", title: "WORKING", filename: "WORKING.md" },
];

export function readAgentOsDoc(filename: string): string {
  const p = agentOsPath(filename);
  if (!fs.existsSync(p)) return "(missing)";
  return fs.readFileSync(p, "utf8");
}
