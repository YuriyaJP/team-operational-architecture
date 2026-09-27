# Configuration Setup

None of the scripts in `/scripts` contain hardcoded calendar IDs, email addresses, or org names. Configuration lives in two places:

## 1. Script Properties (Project Settings → Script Properties)

| Key | Used by | Example value |
|---|---|---|
| `PRIVATE_CALENDAR_ID` | eventCalendarSync.gs | `abc123@group.calendar.google.com` |
| `PUBLIC_CALENDAR_ID` | eventCalendarSync.gs | `def456@group.calendar.google.com` |
| `OPS_CONTACT_EMAIL` | monthlyAttendanceReminders.gs | `ops@example-org.org` |
| `TEST_RECIPIENT` | newEngagementNotification.gs | `you@example-org.org` |

Set these once per spreadsheet copy; the code never has to change.

## 2. Config sheet tabs

- **Directory** (Name | Email) — used by `monthlyAttendanceReminders.gs` to look up who to remind.
- **Managers** (role → email, by cell reference) — used by `contractExpiryReminders.gs` and `newEngagementNotification.gs` so recipients can be updated by anyone without touching Apps Script.

Keeping these two categories out of code is what makes the same script safe to reuse across spreadsheets, and is also why this repository can show real automation logic without exposing any real organisation's data.
