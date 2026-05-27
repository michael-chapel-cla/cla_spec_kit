# Roadmap — ExpenseFlow

## Phase 1 — MVP (months 1–3)

Core submission-approval-export loop. Proves the workflow end-to-end for the first paying tenants.

- Expense report creation with line items and receipt upload
- Single-level manager approval workflow
- Basic policy rules: per-category amount limits, receipt required flag
- Finance CSV export of approved expenses by period
- Email notifications (submitted, approved, rejected, reimbursed)
- Multi-tenant data isolation (TenantId on all tables)
- RBAC: employee / manager / finance / admin
- Azure Entra authentication (OIDC SPA + RS256 JWT API)
- Docker Compose local dev environment

**Exit criteria**: at least two external tenants using the product; average time to approval under 48 hours.

---

## Phase 2 — Workflow completeness (months 4–6)

Reduce the most common friction points uncovered in Phase 1.

- **Receipt OCR**: extract merchant, date, and amount automatically from uploaded photos (Azure AI Vision or equivalent)
- **Multi-step approval chains**: configurable escalation — direct manager + department head for amounts over threshold
- **Auto-approve**: bypass manager queue for amounts under a tenant-configured threshold
- **Recurring expense reports**: clone a previous report as a starting point
- **Department and cost-centre tagging**: tag line items for accounting code export
- **Reject and resubmit**: employee edits a rejected report and resubmits without creating a new record
- **Reimbursement marking**: finance marks approved reports as reimbursed; employee notified
- **Submission deadline reminders**: scheduled email to employees with unreported spend older than N days

---

## Phase 3 — Analytics and integrations (months 7–12)

Turn accumulated spend data into a second value layer and reduce finance manual work.

- **Spend dashboard**: spend by category, department, and period with trend lines
- **Anomaly detection**: flag submissions that deviate significantly from the submitting user's historical patterns
- **Policy recommendation engine**: suggest policy adjustments based on common exception patterns
- **Accounting export integrations**: QuickBooks, Xero, Sage — map categories to nominal codes
- **SCIM provisioning**: auto-sync users and departments from Entra or HR system
- **Redis caching**: approval queue and spend aggregation cache — reduce DB load at month-end burst
- **OpenTelemetry tracing**: end-to-end request tracing for production observability
- **SOC 2 preparation**: audit log retention, data deletion workflows, access control review

---

## Phase 4 — Scale and expansion (12+ months)

- Mobile native app (React Native) for receipt capture and approval on the go
- Multi-currency support with exchange rate stamping at submission time
- Payroll integration stubs (ADP, Sage Payroll) for direct reimbursement
- Advisor / accountant portal: external read-only access to a tenant's export data
- Marketplace listing: Azure Marketplace and Microsoft AppSource
- Enterprise tier: SSO via SAML, dedicated DB, SLA-backed support
