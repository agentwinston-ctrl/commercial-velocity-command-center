import { readTodoDoc } from "@/lib/todos";

export default function TodosWinstonPage() {
  const content = readTodoDoc("winston");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Winston — Todo</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">What I’ve done and what I’m doing next.</p>

      <pre className="mt-6 whitespace-pre-wrap break-words rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm leading-relaxed">
        {content}
      </pre>
    </div>
  );
}
