# WORKING — Winston (CEO)

Last updated: 2026-02-14 11:46 PST

Current constraint: Measurement is incomplete, so constraint detection is not yet reliable (pipeline + retention blocks still missing key fields).

Today’s top 3 priorities:
1. Lock the scoreboard schema (<=12 columns) with MRR-style retention tracking.
2. Wire Stripe + GHL + calendar capacity so we can compute the acquisition chain and constraint weekly.
3. Backfill at least 8 weeks so trend rules (cash up weekly, churn thresholds) actually work.

Active experiments:
-

Pending decisions (waiting on Devon):
-

Open loops:
- Weekly priorities in goals.md still blank.

Notes:
- Retention block needs MRR-friendly tracking: clients_active_start_of_month, clients_churned_mtd, churn_pct_30d rolling. Keep clients_at_risk as leading indicator.
