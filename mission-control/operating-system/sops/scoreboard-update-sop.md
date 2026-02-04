# SOP — Scoreboard Update (RADAR)

Purpose: keep one set of numbers everyone trusts, so priorities are obvious.

## Frequency
Every Friday by 12pm local.

## Inputs
### Stripe (Revenue)
- Cash collected last 7 days
- Cash collected last 30 days
- Current MRR
- Churn % last 30 days (logo churn + revenue churn if available)

### GHL (Pipeline)
- New leads (7D)
- Median speed-to-lead (minutes)
- Booked calls (7D)
- Showed calls (7D)
- Offers made (7D)
- Deals closed (7D)

## Calculations
- Booking rate = booked calls ÷ new leads
- Show rate = showed calls ÷ booked calls
- Close rate = deals closed ÷ showed calls
- Cash per call = cash collected (7D) ÷ showed calls

## Output
Update `scoreboard/scoreboard.csv` row for the current week.

## Notes
If any metric is missing, write "MISSING" and list what’s needed in Notes.
