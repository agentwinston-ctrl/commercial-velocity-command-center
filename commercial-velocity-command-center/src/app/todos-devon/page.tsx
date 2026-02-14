import { readTodoDoc } from "@/lib/todos";

export default function TodosDevonPage() {
  const content = readTodoDoc("devon");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Devon — Todo</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Edit by telling Winston in Telegram. This page is read-only.</p>

      <pre className="mt-6 whitespace-pre-wrap break-words rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm leading-relaxed">
        {content}
      </pre>
    </div>
  );
}
