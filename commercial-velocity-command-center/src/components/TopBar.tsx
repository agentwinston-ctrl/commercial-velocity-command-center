export default function TopBar() {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="text-sm text-slate-300">Operator OS</div>
        <div className="text-xs text-slate-500">
          Red means you have no plan. Fix the constraint.
        </div>
      </div>
    </div>
  );
}
