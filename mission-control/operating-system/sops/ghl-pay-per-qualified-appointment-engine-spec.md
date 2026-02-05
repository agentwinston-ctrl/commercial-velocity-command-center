# GHL Build Spec — Pay-Per-Qualified Appointment Engine (CRE)

Owner: Commercial Rev Engine
Last updated: 2026-02-04

## North Star
Book **qualified commercial roofing estimate appointments** onto **client calendars**, track every step, and support a pay-per-qualified-appointment billing model.

Lead sources now: FB group (primary) + Google (mixed: organic/paid) + future SEO.

## Architecture decisions
- **One CRE Master GHL** as system of record.
- **Book directly on client calendars** (GHL Calendar → client Google Calendar sync).
- Leads stay in CRE Master. Clients receive booked events + notifications + optionally a lightweight client portal/report.

## Core objects
### Custom fields (Contact)
- Service Area (metros/counties) (text)
- State (dropdown)
- Commercial Only? (yes/no)
- Company Name
- Role (Owner/GM/Estimator/Admin)
- Desired Inspections Per Month (number)
- Capacity: Can run 20+ estimates/mo? (yes/no)
- Job Type Needed (repair/maintenance/re-roof/roof coating/unknown)
- Building Type (warehouse/retail/multi-family/other)
- SQFT (number/unknown)
- Budget comfort (optional)
- Source (FB/Google/SEO/Referral)
- Lead Intent (hot/warm/cold)

### Tags
- src_fb
- src_google
- src_seo
- stage_new
- stage_engaged
- stage_booked
- stage_no_show
- stage_closed_won
- stage_closed_lost
- qualified_yes
- qualified_no
- qualified_review
- client_{clientName}
- geo_{metro}

## Pipelines
### Pipeline A: Lead Intake → Qualification → Booking (CRE)
Stages:
1) New Lead
2) Attempting Contact
3) Engaged (Two-way)
4) Qualified
5) Booked (Appointment Set)
6) Showed
7) No-Show
8) Closed Won (Client confirmed job/opportunity) (optional)
9) Closed Lost

### Pipeline B: Client Dispute / QA (internal)
Stages:
1) Dispute Submitted
2) Reviewing
3) Approved Credit
4) Denied

## Calendars
- One Calendar Group per client
- One calendar per rep if needed

Required calendar settings:
- Buffers, working hours, min notice
- Location/meeting link
- Confirmation required (optional)

## Qualification Policy (enforceable)
Use `memory/training/sales/cre-calendar-protection-policy.md` as baseline.

### V1 defaults (until per-client overrides exist)
- Service area: **150-mile radius from Columbus, OH**
- Roof types accepted: **Flat/low-slope + metal**
- Minimum size: **10,000+ sqft**

Minimum to mark Qualified:
- In service area
- Commercial roofing (not residential)
- Roof type fits (flat/low-slope or metal)
- Size fits (10k+ sqft)
- Decision maker path identified
- Capacity alignment (client can handle)

## Automations (Workflows)
### WF1: New Lead → Speed to Lead
Trigger: Contact created / form submitted / inbound call
Actions:
- Immediate SMS: acknowledge + 1 question (commercial? service area?)
- Immediate email: short, plain text
- Create task: Call within 2 minutes
- If no response in 10 min: send follow-up SMS
- If no response in 3 hours: send “different angle” SMS

SLA tracking:
- Store first-touch timestamp
- Track response time

### WF2: Engaged → Qualify
Trigger: inbound reply OR manual stage change to Engaged
Actions:
- Send 2-question qualifier via SMS (one point per text)
- Apply tags based on answers
- If clearly unqualified: tag qualified_no, move to Closed Lost
- If qualified: move to Qualified

### WF3: Qualified → Route + Book to Client Calendar
Trigger: stage = Qualified
Logic:
- Determine client routing based on:
  - geo
  - capacity (max appointments/day)
  - job type preference
  - exclusivity rules
Actions:
- Assign `client_{x}` tag
- Send booking link (client calendar)
- If they prefer, book manually via internal rep using calendar
- When booked: move to Booked

### WF4: Booked → Confirmation + Show Up System
Trigger: appointment booked
Actions:
- Redirect to confirmation page (if funnel-based) OR send confirmation page link
- SMS: confirmation + reschedule link
- Email: what happens next + proof link
- 24h reminder SMS: confirm/reschedule
- 2h reminder SMS: confirm
- 15m: “I’m here”

Reference:
- `memory/training/operations/cre-confirmation-page-sop.md`
- `memory/training/sales/cre-email-matrix-sop.md`

### WF5: No-Show Rescue
Trigger: appointment status no-show
Actions:
- SMS: “All good. Want to reschedule? A or B”
- 2h later: close-the-loop yes/no
- Next day: proof asset + reschedule link

Reference:
- `memory/training/sales/cre-show-rate-connection-mastery.md`

### WF6: Qualified Appointment Billing Event
Trigger: appointment marked Showed AND Qualified = yes
Actions:
- Create internal record (custom object or Google Sheet) with:
  - client
  - lead ID
  - appointment time
  - source
- Notify finance channel
- Optional: create Stripe invoice item (manual review first)

### WF7: Dispute Flow
Trigger: client replies “unqualified” OR submits form
Actions:
- Create dispute in Pipeline B
- Attach call recording + form answers
- Decision: credit/deny

## Assets to create
1) Confirmation page template (GHL)
2) Proof pack PDF (calendar screenshot + short case study + how it works)
3) 6 “Hammer Them” short videos scripts
4) 3 breakout Q&A modules scripts

Reference:
- `memory/training/marketing/cre-hammer-them-retargeting-sop.md`

## Reporting
Weekly client report (auto email + dashboard screenshot if needed):
- leads received
- qualified
- booked
- show rate
- disputes

## Acceptance criteria
- New lead receives first response within 60 seconds (automation)
- Rep task created for human follow-up
- Qualified leads route to correct client and can be booked
- Reminders fire and no-show rescue works
- All events are logged for pay-per-qualified billing
