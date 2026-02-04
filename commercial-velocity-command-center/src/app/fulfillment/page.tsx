export default function FulfillmentPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Fulfillment</h1>
      <p className="mt-1 text-sm text-slate-300">
        Delivery metrics are cash metrics. This page is next.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm font-semibold">Coming in v1.1</div>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>Leads received</li>
          <li>Lead → booked %</li>
          <li>Booked → showed %</li>
          <li>Pilot clients health + kill switch</li>
        </ul>
      </div>
    </div>
  );
}
