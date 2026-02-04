import ThemeToggle from "@/components/ThemeToggle";

export default function TopBar() {
  return (
    <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="text-sm text-[var(--muted)]">Operator OS</div>
        <div className="flex items-center gap-3">
          <div className="hidden text-xs text-[var(--muted2)] md:block">
            Red means you have no plan. Fix the constraint.
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
