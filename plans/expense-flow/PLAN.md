# PLAN — ExpenseFlow

## Overview

**App name**: ExpenseFlow  
**Description**: Multi-tenant SaaS platform for employee expense submission, manager approval, and finance reporting.

**Three repositories:**
| Repo | Path in spec kit |
|---|---|
| `web-api-expense-flow` | `/repos/web-api-expense-flow/` |
| `web-expense-flow` | `/repos/web-expense-flow/` |
| `db-expense-flow` | `/repos/db-expense-flow/` |

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Auth | Azure Entra — RS256 JWT | Org standard; stateless, no session store |
| RBAC | Role stored in `dbo.UserRoles`, enforced per-route via `requireScope` middleware | Not Entra groups — role assignment managed in-app |
| Multi-tenancy | `TenantId INT` column on every table; injected at DB client layer from JWT claims | Row-level isolation, no separate schema per tenant |
| Receipt storage | Azure Blob Storage, one container per tenant (`receipts-{tenantId}`), SAS token access | No public URLs — all downloads via API |
| Notifications | Async SMTP/SendGrid | No real-time requirement |
| DB client | mssql ConnectionPool created once at startup; parameterized queries only | Security and performance |
| Caching | None for MVP | Redis deferred to Phase 2 |
| API versioning | URI versioning — `/api/v1/ResourceName` | Org standard |

---

## Directory Structure

```
/repos/web-api-expense-flow/
├── src/
│   ├── features/
│   │   ├── expenseReports/v1/
│   │   │   ├── expenseReports.routes.ts
│   │   │   ├── expenseReports.service.ts
│   │   │   ├── expenseReports.schema.ts
│   │   │   └── expenseReports.types.ts
│   │   ├── expenseLineItems/v1/
│   │   │   ├── expenseLineItems.routes.ts
│   │   │   ├── expenseLineItems.service.ts
│   │   │   ├── expenseLineItems.schema.ts
│   │   │   └── expenseLineItems.types.ts
│   │   ├── receipts/v1/
│   │   │   ├── receipts.routes.ts
│   │   │   ├── receipts.service.ts
│   │   │   ├── receipts.schema.ts
│   │   │   └── receipts.types.ts
│   │   ├── approvals/v1/
│   │   │   ├── approvals.routes.ts
│   │   │   ├── approvals.service.ts
│   │   │   ├── approvals.schema.ts
│   │   │   └── approvals.types.ts
│   │   ├── users/v1/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.schema.ts
│   │   │   └── users.types.ts
│   │   ├── policies/v1/
│   │   │   ├── policies.routes.ts
│   │   │   ├── policies.service.ts
│   │   │   ├── policies.schema.ts
│   │   │   └── policies.types.ts
│   │   └── reports/v1/
│   │       ├── reports.routes.ts
│   │       ├── reports.service.ts
│   │       ├── reports.schema.ts
│   │       └── reports.types.ts
│   └── shared/
│       ├── auth/
│       │   ├── auth.middleware.ts
│       │   └── auth.types.ts
│       ├── db/
│       │   ├── db.client.ts
│       │   └── db.types.ts
│       └── errors/
│           └── error.handler.ts
├── docs/
│   ├── openapi.yaml
│   └── ops/runbook.md
├── postman/
│   ├── collections/expense-flow.json
│   └── environments/expense-flow-local.postman_environment.json
├── tests/
│   ├── unit/
│   │   ├── expenseReports.service.test.ts
│   │   ├── expenseLineItems.service.test.ts
│   │   ├── receipts.service.test.ts
│   │   ├── approvals.service.test.ts
│   │   ├── users.service.test.ts
│   │   ├── policies.service.test.ts
│   │   └── reports.service.test.ts
│   └── integration/
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-dev.yaml
│   ├── values-qa.yaml
│   ├── values-uat.yaml
│   └── values-prd.yaml
├── .devcontainer/devcontainer.json
├── .env.example
├── docker-compose.yml
└── .github/workflows/ci.yml
├── package.json
└── .github/copilot-instructions.md

/repos/db-expense-flow/
├── migrations/
│   ├── V1.0.0__create_schema.sql
│   ├── V1.0.1__create_tenants_users.sql
│   ├── V1.0.2__create_expense_tables.sql
│   └── V1.0.3__create_approvals_notifications.sql
├── seeds/
│   └── seed_reference_data.sql
├── .devcontainer/devcontainer.json
├── docker-compose.yml
├── flyway.conf.example
├── README.md
└── .github/copilot-instructions.md

/repos/web-expense-flow/
├── src/
│   ├── pages/
│   │   ├── MyExpenses/MyExpenses.tsx
│   │   ├── NewReport/NewReport.tsx
│   │   ├── ReportDetail/ReportDetail.tsx
│   │   ├── ApprovalQueue/ApprovalQueue.tsx
│   │   ├── ApprovalDetail/ApprovalDetail.tsx
│   │   ├── FinanceDashboard/FinanceDashboard.tsx
│   │   ├── Policies/Policies.tsx
│   │   └── Users/Users.tsx
│   ├── components/
│   │   ├── StatusChip.tsx
│   │   └── CurrencyDisplay.tsx
│   ├── services/
│   │   ├── expenseReportsApi.ts
│   │   ├── approvalsApi.ts
│   │   ├── usersApi.ts
│   │   ├── policiesApi.ts
│   │   └── reportsApi.ts
│   ├── types/
│   │   └── expenseFlow.types.ts
│   └── router.tsx
├── public/static-config.json
├── test/unit/
│   ├── MyExpenses.test.tsx
│   ├── ApprovalQueue.test.tsx
│   └── FinanceDashboard.test.tsx
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-dev.yaml
│   ├── values-qa.yaml
│   ├── values-uat.yaml
│   └── values-prd.yaml
├── .devcontainer/devcontainer.json
├── docker-compose.yml
└── .github/workflows/ci.yml
├── package.json
└── .github/copilot-instructions.md
```

---

## API Endpoints

### Health (unprotected)
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe — returns `{ status, timestamp, checks }` |
| GET | `/health/ready` | Kubernetes readiness probe |

### ExpenseReports (scope: `employee`, `manager`, `finance`, `admin`)
| Method | Path | Description | Auth Scope | Status Codes |
|---|---|---|---|---|
| GET | `/api/v1/ExpenseReports` | List current user's reports (employee) or all for tenant (finance/admin) | all | 200, 401, 403 |
| POST | `/api/v1/ExpenseReports` | Create a new draft report | employee | 201+Location, 400, 422 |
| GET | `/api/v1/ExpenseReports/:id` | Get a specific report with line items | all | 200, 401, 403, 404 |
| PATCH | `/api/v1/ExpenseReports/:id` | Update a draft report (title, period) | employee | 200, 400, 403, 404, 422 |
| POST | `/api/v1/ExpenseReports/:id/Submit` | Submit report for approval; runs policy check | employee | 200, 403, 404, 422 |
| DELETE | `/api/v1/ExpenseReports/:id` | Delete a draft report | employee | 204, 403, 404, 409 |

**POST /api/v1/ExpenseReports request body:**
```json
{ "title": "string (required)", "periodStart": "date (required)", "periodEnd": "date (required)" }
```
**PATCH request body:** same fields, all optional.

### ExpenseLineItems (scope: `employee`)
| Method | Path | Description | Status Codes |
|---|---|---|---|
| GET | `/api/v1/ExpenseLineItems?reportId=` | List items for a report | 200, 400, 403, 404 |
| POST | `/api/v1/ExpenseLineItems` | Add a line item to a draft report | 201+Location, 400, 403, 422 |
| PUT | `/api/v1/ExpenseLineItems/:id` | Update a line item | 200, 400, 403, 404, 422 |
| DELETE | `/api/v1/ExpenseLineItems/:id` | Remove a line item from a draft report | 204, 403, 404, 409 |

**POST/PUT request body:**
```json
{
  "reportId": "number (required on POST)",
  "category": "string enum: meals|travel|accommodation|other (required)",
  "amount": "number (required, min 0.01)",
  "currency": "string ISO 4217, default GBP",
  "spendDate": "date (required)",
  "merchant": "string (optional)",
  "notes": "string (optional)",
  "receiptId": "number (optional)"
}
```

### Receipts
| Method | Path | Description | Scope | Status Codes |
|---|---|---|---|---|
| POST | `/api/v1/Receipts` | Upload receipt image (multipart/form-data) | employee | 201+Location, 400, 413, 422 |
| GET | `/api/v1/Receipts/:id/Download` | Get a short-lived SAS URL for receipt download | all | 200, 403, 404 |

### Approvals (scope: `manager`, `finance`, `admin`)
| Method | Path | Description | Status Codes |
|---|---|---|---|
| GET | `/api/v1/Approvals` | List pending approvals for the current manager | 200, 401, 403 |
| POST | `/api/v1/Approvals` | Approve or reject a report | 201+Location, 400, 403, 404, 409, 422 |
| GET | `/api/v1/Approvals/:id` | Get approval detail | 200, 403, 404 |

**POST request body:**
```json
{ "reportId": "number (required)", "decision": "Approved|Rejected (required)", "comment": "string (optional, required on Rejected)" }
```

### Users
| Method | Path | Description | Scope | Status Codes |
|---|---|---|---|---|
| GET | `/api/v1/Users/Me` | Current user profile | all | 200, 401 |
| GET | `/api/v1/Users` | List users in tenant | finance, admin | 200, 403 |

### Policies
| Method | Path | Description | Scope | Status Codes |
|---|---|---|---|---|
| GET | `/api/v1/Policies` | List active policies for tenant | finance, admin | 200, 403 |
| POST | `/api/v1/Policies` | Create a policy rule | finance, admin | 201+Location, 400, 422 |
| PUT | `/api/v1/Policies/:id` | Update a policy rule | finance, admin | 200, 400, 404, 422 |
| DELETE | `/api/v1/Policies/:id` | Deactivate a policy rule | finance, admin | 204, 403, 404 |

**POST/PUT request body:**
```json
{
  "category": "meals|travel|accommodation|other",
  "maxAmountPerItem": "number (optional)",
  "maxAmountPerDay": "number (optional)",
  "requiresReceipt": "boolean",
  "requiresNotes": "boolean"
}
```

### Reports (Finance)
| Method | Path | Description | Scope | Status Codes |
|---|---|---|---|---|
| GET | `/api/v1/Reports/Spend` | Aggregated spend by category/department/period | finance, admin | 200, 400, 403 |
| GET | `/api/v1/Reports/Export` | CSV export of approved expenses for a period | finance, admin | 200, 400, 403 |

Query params for both: `periodStart`, `periodEnd`, optional `departmentId`.

---

## Database Schema

### dbo.Tenants
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| Name | NVARCHAR(255) | NOT NULL |
| Slug | NVARCHAR(100) | NOT NULL UNIQUE |
| IsActive | BIT | NOT NULL DEFAULT 1 |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

### dbo.Users
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| EntraOid | NVARCHAR(36) | NOT NULL |
| DisplayName | NVARCHAR(255) | NOT NULL |
| Email | NVARCHAR(320) | NOT NULL |
| DepartmentId | INT | NULL FK Departments(Id) |
| ManagerUserId | INT | NULL FK Users(Id) |
| IsActive | BIT | NOT NULL DEFAULT 1 |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

Index: `IX_Users_TenantId_EntraOid` on (TenantId, EntraOid)

### dbo.UserRoles
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| UserId | INT | NOT NULL FK Users(Id) |
| Role | NVARCHAR(50) | NOT NULL — employee/manager/finance/admin |
| GrantedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

### dbo.Departments
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| Name | NVARCHAR(255) | NOT NULL |
| CostCentreCode | NVARCHAR(50) | NULL |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

### dbo.ExpensePolicies
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| Category | NVARCHAR(100) | NOT NULL — meals/travel/accommodation/other |
| MaxAmountPerItem | DECIMAL(18,2) | NULL |
| MaxAmountPerDay | DECIMAL(18,2) | NULL |
| RequiresReceipt | BIT | NOT NULL DEFAULT 1 |
| RequiresNotes | BIT | NOT NULL DEFAULT 0 |
| IsActive | BIT | NOT NULL DEFAULT 1 |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

### dbo.ExpenseReports
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| UserId | INT | NOT NULL FK Users(Id) |
| Title | NVARCHAR(255) | NOT NULL |
| PeriodStart | DATE | NOT NULL |
| PeriodEnd | DATE | NOT NULL |
| Status | NVARCHAR(50) | NOT NULL — Draft/Pending/Approved/Rejected/Reimbursed |
| SubmittedOn | DATETIME2 | NULL |
| TotalAmount | DECIMAL(18,2) | NOT NULL DEFAULT 0 |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

Index: `IX_ExpenseReports_TenantId_UserId_Status` on (TenantId, UserId, Status)
Index: `IX_ExpenseReports_TenantId_Status` on (TenantId, Status)

### dbo.ExpenseLineItems
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| ReportId | INT | NOT NULL FK ExpenseReports(Id) |
| Category | NVARCHAR(100) | NOT NULL |
| Amount | DECIMAL(18,2) | NOT NULL |
| Currency | NCHAR(3) | NOT NULL DEFAULT 'GBP' |
| SpendDate | DATE | NOT NULL |
| Merchant | NVARCHAR(255) | NULL |
| Notes | NVARCHAR(2000) | NULL |
| ReceiptId | INT | NULL FK Receipts(Id) |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

Index: `IX_ExpenseLineItems_TenantId_ReportId` on (TenantId, ReportId)

### dbo.Receipts
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| UploadedByUserId | INT | NOT NULL FK Users(Id) |
| BlobPath | NVARCHAR(500) | NOT NULL |
| ContentType | NVARCHAR(100) | NOT NULL |
| FileSizeBytes | INT | NOT NULL |
| OriginalFileName | NVARCHAR(255) | NULL |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

### dbo.Approvals
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| ReportId | INT | NOT NULL FK ExpenseReports(Id) |
| ApproverId | INT | NOT NULL FK Users(Id) |
| Decision | NVARCHAR(20) | NOT NULL — Approved/Rejected |
| Comment | NVARCHAR(2000) | NULL |
| DecidedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

Index: `IX_Approvals_TenantId_ReportId` on (TenantId, ReportId)

### dbo.Notifications
| Column | Type | Constraints |
|---|---|---|
| Id | INT | PK IDENTITY(1,1) |
| TenantId | INT | NOT NULL FK Tenants(Id) |
| RecipientUserId | INT | NOT NULL FK Users(Id) |
| EventType | NVARCHAR(100) | NOT NULL |
| ReportId | INT | NULL FK ExpenseReports(Id) |
| SentOn | DATETIME2 | NULL |
| DeliveryStatus | NVARCHAR(50) | NOT NULL DEFAULT 'Pending' |
| CreatedOn | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() |
| ModifiedOn | DATETIME2 | NULL |

**Flyway migration files** (in `db-expense-flow/migrations/`):
- `V1.0.0__create_schema.sql` — create `ExpenseFlow` schema
- `V1.0.1__create_tenants_users.sql` — Tenants, Users, UserRoles, Departments
- `V1.0.2__create_expense_tables.sql` — ExpensePolicies, ExpenseReports, ExpenseLineItems, Receipts
- `V1.0.3__create_approvals_notifications.sql` — Approvals, Notifications

---

## Frontend Pages and Components

| Page | Route | TSX Path | Auth | API Calls |
|---|---|---|---|---|
| MyExpenses | `/expenses` | `src/pages/MyExpenses/MyExpenses.tsx` | protected | `GET /api/v1/ExpenseReports` |
| NewReport | `/expenses/new` | `src/pages/NewReport/NewReport.tsx` | protected | `POST /api/v1/ExpenseReports`, `POST /api/v1/ExpenseLineItems`, `POST /api/v1/Receipts` |
| ReportDetail | `/expenses/:id` | `src/pages/ReportDetail/ReportDetail.tsx` | protected | `GET /api/v1/ExpenseReports/:id`, `GET /api/v1/ExpenseLineItems?reportId=`, `POST /api/v1/ExpenseReports/:id/Submit` |
| ApprovalQueue | `/approvals` | `src/pages/ApprovalQueue/ApprovalQueue.tsx` | protected (manager) | `GET /api/v1/Approvals` |
| ApprovalDetail | `/approvals/:id` | `src/pages/ApprovalDetail/ApprovalDetail.tsx` | protected (manager) | `GET /api/v1/Approvals/:id`, `POST /api/v1/Approvals` |
| FinanceDashboard | `/finance` | `src/pages/FinanceDashboard/FinanceDashboard.tsx` | protected (finance) | `GET /api/v1/Reports/Spend`, `GET /api/v1/Reports/Export`, `GET /api/v1/ExpenseReports` |
| Policies | `/admin/policies` | `src/pages/Policies/Policies.tsx` | protected (finance/admin) | `GET /api/v1/Policies`, `POST /api/v1/Policies`, `PUT /api/v1/Policies/:id`, `DELETE /api/v1/Policies/:id` |
| Users | `/admin/users` | `src/pages/Users/Users.tsx` | protected (admin) | `GET /api/v1/Users` |

Shared components:
- `src/components/StatusChip.tsx` — MUI Chip coloured by report status
- `src/components/CurrencyDisplay.tsx` — formatted currency amount

Services:
- `src/services/expenseReportsApi.ts` — expense report CRUD + submit + line items
- `src/services/approvalsApi.ts` — approval queue and decisions
- `src/services/usersApi.ts` — current user profile and user list
- `src/services/policiesApi.ts` — policy CRUD
- `src/services/reportsApi.ts` — spend aggregation and CSV export

---

## Helm Configuration

### `web-api-expense-flow/helm/`
- `Chart.yaml`: `name: web-api-expense-flow`
- `values.yaml`: `app.name: web-api-expense-flow`, `image.repository: helm/web-api-expense-flow`, `istio.pathPrefix: /api`, `container.port: 8080`
- `values-dev.yaml`: `istio.hosts: ["expense-flow-api.dev.internal"]`
- `values-qa.yaml`: `istio.hosts: ["expense-flow-api.qa.internal"]`
- `values-uat.yaml`: `istio.hosts: ["expense-flow-api.uat.internal"]`
- `values-prd.yaml`: `istio.hosts: ["expense-flow-api.internal"]`

### `web-expense-flow/helm/`
- `Chart.yaml`: `name: web-expense-flow`
- `values.yaml`: `app.name: web-expense-flow`, `image.repository: helm/web-expense-flow`, `istio.pathPrefix: /`, `container.port: 3000`
- `values-dev.yaml`: `istio.hosts: ["expense-flow.dev.internal"]`
- `values-qa.yaml`: `istio.hosts: ["expense-flow.qa.internal"]`
- `values-uat.yaml`: `istio.hosts: ["expense-flow.uat.internal"]`
- `values-prd.yaml`: `istio.hosts: ["expense-flow.internal"]`

---

## Azure Entra Configuration

- **App registration name**: `ExpenseFlow`
- **Required scopes**: `api://expense-flow/ExpenseReports.Read`, `api://expense-flow/ExpenseReports.Write`, `api://expense-flow/Approvals.Write`
- **Frontend redirect URI (dev)**: `http://localhost:3000/auth/callback`
- **Backend `ENTRA_AUDIENCE`**: `api://expense-flow` (app ID URI — set at deploy)
- **Backend `ENTRA_ISSUER`**: `https://login.microsoftonline.com/{tenantId}/v2.0`

---

## Environment Variables — API Backend

| Variable | Description | Example | Required |
|---|---|---|---|
| `DB_SERVER` | MSSQL server hostname | `localhost` | yes |
| `DB_DATABASE` | Database name | `ExpenseFlowDb` | yes |
| `DB_USER` | DB username | `sa` | yes |
| `DB_PASSWORD` | DB password | — | yes |
| `DB_PORT` | DB port | `1433` | yes |
| `ENTRA_ISSUER` | JWT issuer | `https://login.microsoftonline.com/<tenant>/v2.0` | yes |
| `ENTRA_AUDIENCE` | JWT audience | `api://expense-flow` | yes |
| `CORS_ORIGINS` | Allowed origins | `http://localhost:3000` | yes |
| `BLOB_ACCOUNT_NAME` | Azure Storage account name | `expenseflowstorage` | yes |
| `BLOB_ACCOUNT_KEY` | Azure Storage account key | — | yes |
| `SMTP_HOST` | Email server host | `smtp.sendgrid.net` | yes |
| `SMTP_PORT` | Email server port | `587` | yes |
| `SMTP_USER` | Email username | `apikey` | yes |
| `SMTP_PASS` | Email password / API key | — | yes |
| `SMTP_FROM` | From address | `noreply@expense-flow.internal` | yes |

---

## Build Phases

### Phase 1 — MVP

**DB migrations:**
1. Create `V1.0.0__create_schema.sql` — `CREATE SCHEMA IF NOT EXISTS` no-op guard
2. Create `V1.0.1__create_tenants_users.sql` — Tenants, Users, UserRoles, Departments tables + indexes
3. Create `V1.0.2__create_expense_tables.sql` — ExpensePolicies, ExpenseReports, ExpenseLineItems, Receipts + indexes
4. Create `V1.0.3__create_approvals_notifications.sql` — Approvals, Notifications + indexes

**API:**
5. Implement `GET /health`, `GET /health/ready` (no auth)
6. Implement `GET /api/v1/Users/Me` — upsert user on first login
7. Implement `GET /api/v1/ExpenseReports`, `POST /api/v1/ExpenseReports`
8. Implement `GET /api/v1/ExpenseReports/:id`, `PATCH /api/v1/ExpenseReports/:id`, `DELETE /api/v1/ExpenseReports/:id`
9. Implement `POST /api/v1/ExpenseReports/:id/Submit` — policy evaluation logic
10. Implement `GET /api/v1/ExpenseLineItems`, `POST /api/v1/ExpenseLineItems`, `PUT /api/v1/ExpenseLineItems/:id`, `DELETE /api/v1/ExpenseLineItems/:id`
11. Implement `POST /api/v1/Receipts`, `GET /api/v1/Receipts/:id/Download` (SAS URL generation)
12. Implement `GET /api/v1/Approvals`, `POST /api/v1/Approvals`, `GET /api/v1/Approvals/:id`
13. Implement `GET /api/v1/Reports/Spend`, `GET /api/v1/Reports/Export` (CSV)
14. Implement `GET /api/v1/Policies`, `POST /api/v1/Policies`, `PUT /api/v1/Policies/:id`, `DELETE /api/v1/Policies/:id`
15. Add async email notification on Submit, Approve, Reject events
16. Write service unit test stubs for all 7 features

**Frontend:**
17. Configure router with all 8 routes + auth protection
18. Implement `MyExpenses` page — report list with status chips
19. Implement `NewReport` page — form with line items and receipt upload
20. Implement `ReportDetail` page — view + submit action
21. Implement `ApprovalQueue` page — pending approvals list
22. Implement `ApprovalDetail` page — approve/reject form
23. Implement `FinanceDashboard` page — spend table + CSV export button
24. Implement `Policies` page — policy CRUD table
25. Implement `Users` page — user list

### Phase 2 — Expansion
- Receipt OCR via Azure AI Vision (auto-fill merchant, date, amount)
- Multi-step approval chains (configurable per tenant)
- Auto-approve under threshold
- Reject-and-resubmit flow (no new record)
- Reimbursement marking by finance
- Submission deadline reminder emails

### Phase 3 — Scale
- Spend analytics dashboard with trend charts
- Anomaly detection on submissions
- QuickBooks / Xero CSV mapping
- SCIM user provisioning from Entra
- Redis caching for approval queue and spend aggregation
- OpenTelemetry tracing

---

## Local Development Setup

All three repos must be cloned as siblings in the same parent directory.

```bash
# 1. Clone all three repos
git clone <url> web-api-expense-flow
git clone <url> web-expense-flow
git clone <url> db-expense-flow

# 2. Install API deps
cd web-api-expense-flow && npm install

# 3. Install frontend deps
cd ../web-expense-flow && npm install

# 4. Create and edit the API env file
cd ../web-api-expense-flow
cp .env.example .env
# Edit .env — fill in DB_PASSWORD, ENTRA_ISSUER, ENTRA_AUDIENCE, BLOB_*, SMTP_*

# 5. Start SQL Server and create the database
docker compose up -d db
docker compose run --rm db-init

# 6. Run Flyway migrations (reads ../db-expense-flow/migrations)
docker compose run --rm flyway

# 7. Start the API backend
docker compose up backend
# OR: npm run dev:watch   (port 8080)

# 8. Configure frontend Entra auth
# Edit web-expense-flow/public/static-config.json
# Set FRAMEWORK_UI_AUTH_ENTRA.clientId and .authority

# 9. Start the frontend
cd ../web-expense-flow
docker compose up
# OR: npm run dev   (port 3000)
```
