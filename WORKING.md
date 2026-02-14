# WORKING — Winston (CEO)

Last updated: 2026-02-14 12:16 PST

Current constraint: Measurement is incomplete for the acquisition chain (GHL not wired), but cash + retention now have real Stripe-backed metrics and an 8-week trend baseline.

Today’s top 3 priorities:
1. Keep the Stripe scoreboard updating weekly (cash + churn + at-risk). Confirm restricted key is installed in .env.
2. Define the future CRM spec for GHL so leads, speed-to-lead, booked, held, and won are clean and not gameable.
3. Fill weekly priorities in goals.md so actions stay aligned.

Active experiments:
-

Pending decisions (waiting on Devon):
-

Open loops:
- GHL auth + pipeline IDs still unknown, so acquisition constraint detection is paused.

Notes:
- Stripe-only scripts now exist: scripts/scoreboard_backfill_8w.mjs and scripts/scoreboard_update_weekly.mjs.
- Scoreboard schema is the 12-column constraint-engine schema. GHL columns remain blank until integrated.
