# Commercial Rev Engine — Operating System (to $100k MRR)

Last updated: 2026-02-04

This folder is the single source of truth for how we run the business week to week.

## North Star
Cash collected (last 30 days). Everything else supports it.

## Constraint triad
1) Leads (by source)
2) Booking rate (lead → booked call)
3) Show rate (booked → showed)

If one is red, that’s the only priority until it’s green.

## System of record
- Revenue: Stripe
- Pipeline + Sales: GoHighLevel (GHL)
- Marketing: (future) Meta + Google

## Cadence
Daily (5 min)
- Check scoreboard red metrics
- Pick 1 constraint to push today

Weekly (Friday)
- Update the scoreboard
- Identify constraint
- Set next week’s 3 priorities

Monthly (1st business day)
- Set targets
- Confirm budget
- Decide the one constraint to fix

Quarterly
- Reset targets and initiatives
- Kill distractions

## Files to use
- Scoreboard: `scoreboard/scoreboard.csv`
- Weekly plan: `templates/weekly-plan.md`
- Monthly plan: `templates/monthly-plan.md`
- Quarterly plan: `templates/quarterly-plan.md`
- SOP: `sops/scoreboard-update-sop.md`

## Who owns what
- RADAR owns the scoreboard update
- WINSTON owns priority setting + constraint calling
- Devon executes daily priorities
