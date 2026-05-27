# Idea — ExpenseFlow

## What is it?
A multi-tenant SaaS platform that replaces email chains, PDF forms, and spreadsheet reconciliation with a structured workflow for employee expense submission, manager approval, and finance reporting.

## The problem
Mid-size companies (50–500 employees) handle expense reimbursement through ad-hoc combinations of emailed receipts, PDF forms, and manual spreadsheet entry. This creates:
- Delayed reimbursements that frustrate employees
- Policy violations that go undetected until quarterly audit
- Finance teams spending 5–15 hours per month chasing missing documentation
- No visibility into spend by department or category until month-end close

## Who uses it?
- **Employees** — submit expenses and attach receipts from mobile or web; track reimbursement status
- **Managers** — review and approve/reject their team's submissions from a single queue
- **Finance admins** — view all approved expenses, configure policy rules, export to CSV for payroll
- **Company admins** — manage users, departments, and system configuration

## Core workflow
1. Employee creates an expense report with line items (amount, category, date, merchant, notes) and uploads receipt photos
2. Employee submits the report — policy rules are checked at submission time (category limits, receipt required)
3. If policy violations exist, employee sees a structured error list and corrects before resubmitting
4. Manager receives an email and reviews the report in a clean approval queue
5. Manager approves or rejects with an optional comment; employee notified by email
6. Finance admin sees all approved reports, marks as reimbursed, exports to CSV

## Key capabilities
- Expense submission with receipt photo upload (mobile and web)
- Single-level manager approval workflow
- Per-category policy rules: max amount per item, max per day, receipt required, notes required
- Finance CSV export with department and cost-centre tagging
- Full audit trail: every submission, edit, approval, rejection, and reimbursement action
- Email notifications at each status change
- Multi-tenant data isolation (one company's data never visible to another)

## Technical approach
- **Auth**: Azure Entra — OIDC for the SPA, RS256 JWT for the API
- **RBAC**: role stored in DB (employee / manager / finance / admin) — not Entra groups
- **Receipts**: stored in Azure Blob Storage with SAS token access only — no public URLs
- **Notifications**: async SMTP or SendGrid — no real-time requirement
- **Multi-tenancy**: TenantId column on every table, enforced at DB client layer

## Out of scope for MVP
- Receipt OCR / auto-fill
- Multi-step approval chains
- Spend analytics dashboards
- Accounting system integrations (QuickBooks, Xero)
- Mobile native app
- Multi-currency conversion
- SSO / SCIM provisioning

## Success metrics
- Average time from submission to approval: under 24 hours
- Finance admin hours per month on expense processing: 50% reduction from baseline
- Percentage of expenses submitted within 7 days of spend date
