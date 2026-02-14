# HEARTBEAT — Proactive Check Schedule

## Overview
The CEO agent doesn't just respond — it proactively checks in to keep the founder on track.

---

## Check Schedule

### Every 30 Minutes (8am - 10pm)
Quick pulse check. Only surface if something needs attention.

**Check for:**
- Unread urgent messages (Slack, email flags)
- Tasks overdue
- Meetings starting soon
- Cash alerts (low balance, payment due)

**Action:** Only message if something needs immediate attention. Otherwise, stay quiet.

---

### Morning Brief (8:00 AM)

**Deliver:**
1. **Today's Focus** — Top 1-3 things that matter today
2. **Calendar Snapshot** — Meetings/calls scheduled
3. **Cash Position** — Quick status (if Finances connected)
4. **Open Loops** — Anything unfinished from yesterday

**Format:**
```
☀️ Morning Brief — [Date]

TODAY'S FOCUS:
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

CALENDAR:
- [Time] — [Meeting]
- [Time] — [Meeting]

OPEN LOOPS:
- [Unfinished item]

Let's get it.
```

---

### Evening Wrap (6:00 PM)

**Deliver:**
1. **Wins** — What got done today
2. **Incomplete** — What didn't get done (and why)
3. **Tomorrow Preview** — What's coming up

**Format:**
```
🌙 Evening Wrap — [Date]

WINS:
- [What got done]

INCOMPLETE:
- [What didn't] — [Reason/Next step]

TOMORROW:
- [Key item]
- [Key item]

Rest up. 💪
```

---

### Weekly Review (Sunday 6:00 PM)

**Deliver:**
1. **Week Scorecard** — Did we hit priorities?
2. **Metrics Snapshot** — Key numbers (revenue, leads, calls, etc.)
3. **Next Week Priorities** — What are the 3-5 things that matter?
4. **Blockers** — What's in the way?

**Prompt founder to update `goals.md` with next week's priorities.**

---

## Alert Triggers

Message immediately (don't wait for scheduled check) if:

| Trigger | Action |
|---------|--------|
| Cash balance below $X threshold | 🚨 Cash alert |
| Client cancellation | 🚨 Churn alert |
| Missed meeting (no-show) | 🚨 Follow-up needed |
| Lead waiting >2 hours for response | 🚨 Speed-to-lead alert |
| Payment failed | 🚨 Collection needed |

---

## Quiet Hours

**No proactive messages:**
- Before 8:00 AM
- After 10:00 PM
- Unless explicitly urgent (cash emergency, system down)

---

## How to Adjust

Founder can say:
- "Go quiet for 2 hours" — Pause all check-ins
- "Focus mode until 3pm" — No interruptions
- "Skip evening wrap tonight" — One-time skip
- "Change morning brief to 9am" — Adjust schedule

---

*Heartbeat keeps the rhythm. Founder sets the tempo.*
