# Leave Manager

## What it does

Leave Manager is an internal HR tool that lets employees request time off, managers approve or reject those requests, and HR administrators configure leave policies and run reports. It replaces spreadsheets, email chains, and manual calendar entries with a single system of record for all employee leave across the organisation.

## Who uses it

- **Employees** — submit leave requests, check remaining balances, view their own history
- **Managers** — review and approve/reject requests for their direct reports, view team availability calendar so they can spot coverage gaps before approving
- **HR Administrators** — configure leave types and accrual rules per tenant, view all requests across the organisation, export reports for payroll

## The problem

Most organisations manage leave through a mix of email requests, shared spreadsheets, and calendar invites. This creates several problems:
- Managers have no visibility into team availability when approving a request — they can't see that three people are already out that week
- Employees don't know their current balance without asking HR
- HR has no reliable audit trail or report for payroll reconciliation at month-end
- There's no enforcement of minimum-notice rules or blackout periods

## Key features

- **Leave request flow** — employees submit a request with leave type, date range, and notes; the system calculates the number of working days and checks balance
- **Manager approval queue** — managers see pending requests with a team availability calendar overlay; one-click approve or reject with an optional note sent back to the employee
- **Balance dashboard** — each employee sees their current balance per leave type (annual, sick, unpaid, parental) with a running history of what has been used and when
- **Team calendar view** — managers see a monthly calendar showing who is out each day across their team
- **Leave types and policies** — HR admins configure leave types: name, annual allocation, whether it accrues monthly or is granted up-front, carry-over rules, and minimum notice days
- **Blackout periods** — HR can define date ranges when leave requests are blocked (e.g. end-of-quarter close)
- **Email notifications** — employees notified of approval/rejection, managers notified of new requests (via email, not real-time push)
- **Reporting** — HR export of all leave taken by employee and type for a given period (CSV download)

## Nice to have (post-MVP)

- Calendar sync (export approved leave to Outlook / Google Calendar as .ics)
- Delegation — employee can assign someone else to cover their responsibilities while they are out
- Multi-level approval — some leave types require both manager and HR sign-off
- Mobile-responsive PWA
- Slack or Teams notification integration

## Competitors or alternatives

- **Spreadsheets + email** — the dominant status quo; zero visibility for managers, no enforcement
- **BambooHR / Workday** — full HRIS suites; far too heavy and expensive for teams that only need leave management
- **CharlieHR / Leavetrack** — closer competitors, but cloud-only SaaS with no self-hosted option; this tool runs in the org's own Azure tenant

## Rough revenue model

Internal tool — no external revenue. The value is replacing licence fees for a third-party leave tool and eliminating the HR overhead of manual tracking. ROI is time saved in HR and reduced payroll errors.

## Visual references (optional)

None — but the dashboard for employees should feel like the expense-flow app: a clean summary card at the top showing balances, then a table of recent/pending requests below. The manager approval queue should show each request as a card with the employee name, dates, type, and days count, with the team calendar visible in a side panel.

## Open questions

- Should carry-over balances expire (e.g. use by March 31 of next year)? Assume yes with configurable expiry date per leave type.
- Do we need to handle part-day leave (e.g. half-day)? Yes — support full-day and half-day requests.
- How do we handle public holidays? Store them per-tenant as a simple list; exclude them from working-day calculations.
- Do managers need to be able to request leave themselves? Yes — they fall back to their own manager (or HR admin if no manager is configured).
