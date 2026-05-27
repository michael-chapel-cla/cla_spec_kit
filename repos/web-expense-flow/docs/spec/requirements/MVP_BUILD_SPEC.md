# MVP Build Spec — ExpenseFlow

## Goal

Ship a working multi-tenant expense management platform that lets employees submit expenses with receipt photos, managers approve or reject, and finance teams export approved data. The MVP proves the core workflow end-to-end without advanced features (OCR, multi-step approvals, analytics).

## MVP feature boundary

| In scope | Out of scope |
|---|---|
| Employee expense report creation and submission | Receipt OCR / auto-fill |
| Receipt photo upload (JPEG, PNG, PDF) | Multi-step approval chains |
| Single-level manager approval workflow | Spend analytics dashboards |
| Basic policy rules (per-category amount limits) | Accounting system integrations |
| Finance CSV export of approved expenses | Mobile native app |
| Email notifications (submit, approve, reject) | Multi-currency conversion |
| RBAC: employee / manager / finance / admin | SSO / SCIM provisioning |
| Multi-tenant data isolation | Real-time notifications |

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, MUI v6, React Router v7, MSAL (framework-react-core) |
| Backend | Fastify, Node.js 20, TypeScript |
| Database | SQL Server 2022, Flyway migrations |
| Receipt storage | Azure Blob Storage — SAS token access only |
| Auth | Azure Entra — RS256 JWT |
| Email | SMTP or SendGrid (env-configured) |
| Deployment | AKS + Helm |
| Local dev | Docker Compose (devcontainer) |

## MVP workflows

### 1. Expense submission
1. Employee signs in via Entra OIDC
2. Creates an expense report (title, period start/end)
3. Adds one or more line items (category, amount, date, merchant, notes)
4. Uploads receipt photo for each line item
5. Submits report — policy rules evaluated at this point
6. If violations: employee sees structured error list with remediation guidance
7. If clean: report status → Pending; manager receives email

### 2. Manager approval
1. Manager views their team's pending reports
2. Opens a report — sees line items, receipts (via SAS URL), totals
3. Approves or rejects with optional comment
4. Employee receives email notification with decision

### 3. Finance export
1. Finance admin views all approved reports filtered by period
2. Reviews totals by department and category
3. Downloads CSV export: employee, report, line items, amounts, categories, approval date

## Guardrails

- All DB queries parameterized — no string concatenation
- TenantId injected on every query — enforced at DB client layer, not per route
- No hardcoded secrets — all from environment variables
- Receipt downloads via short-lived SAS tokens only — no public blob URLs
- Policy evaluation is deterministic — no LLM involvement in financial decisions
- All routes except `/health` and `/health/ready` require valid JWT
- Role checked per-route via `requireScope` middleware after JWT validation
- All API inputs validated with Zod schemas before reaching service layer

## API surface (MVP)

```
Auth
  GET  /health
  GET  /health/ready

Expense Reports
  GET    /api/v1/ExpenseReports
  POST   /api/v1/ExpenseReports
  GET    /api/v1/ExpenseReports/:id
  PATCH  /api/v1/ExpenseReports/:id
  POST   /api/v1/ExpenseReports/:id/Submit
  DELETE /api/v1/ExpenseReports/:id

Line Items
  GET    /api/v1/ExpenseLineItems?reportId=
  POST   /api/v1/ExpenseLineItems
  PUT    /api/v1/ExpenseLineItems/:id
  DELETE /api/v1/ExpenseLineItems/:id

Receipts
  POST   /api/v1/Receipts
  GET    /api/v1/Receipts/:id/Download

Approvals
  GET    /api/v1/Approvals
  POST   /api/v1/Approvals
  GET    /api/v1/Approvals/:id

Users
  GET    /api/v1/Users/Me
  GET    /api/v1/Users

Policies
  GET    /api/v1/Policies
  POST   /api/v1/Policies
  PUT    /api/v1/Policies/:id
  DELETE /api/v1/Policies/:id

Reports
  GET    /api/v1/Reports/Spend
  GET    /api/v1/Reports/Export
```

## Frontend pages (MVP)

| Page | Route | Role |
|---|---|---|
| Login | `/login` | All |
| My Expenses | `/expenses` | employee |
| New Report | `/expenses/new` | employee |
| Report Detail | `/expenses/:id` | employee |
| Approval Queue | `/approvals` | manager |
| Approval Detail | `/approvals/:id` | manager |
| Finance Dashboard | `/finance` | finance, admin |
| Users | `/admin/users` | admin |
| Policies | `/admin/policies` | finance, admin |

## Definition of done

- [ ] Employee can submit a report with at least one line item and one receipt
- [ ] Policy violation at submission returns a 422 with a human-readable error list
- [ ] Manager receives an email within 5 minutes of submission
- [ ] Manager can approve or reject; employee receives email notification
- [ ] Finance admin can download a CSV of all approved expenses for a period
- [ ] All API routes return the correct HTTP status codes as defined in openapi.yaml
- [ ] No public blob URLs — all receipts accessed via SAS Download endpoint
- [ ] 85% test coverage on service layer
- [ ] No hardcoded secrets in any committed file
- [ ] Docker Compose local environment starts cleanly from a fresh clone
