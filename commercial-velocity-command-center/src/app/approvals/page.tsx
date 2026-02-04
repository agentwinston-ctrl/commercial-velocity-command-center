export default function ApprovalsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
      <p className="mt-1 text-sm text-slate-300">
        Red light compliance: outbound drafts live here.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm font-semibold">Coming next</div>
        <p className="mt-2 text-sm text-slate-400">
          Draft message → you approve → then it can send.
        </p>
      </div>
    </div>
  );
}
