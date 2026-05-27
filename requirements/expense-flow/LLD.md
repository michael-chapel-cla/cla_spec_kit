# LLD — ExpenseFlow

## Product separation
ExpenseFlow runs as an isolated product with its own Entra app registration, database, blob storage container, and AKS deployment. It shares no infrastructure with other applications.

## Repository model

ExpenseFlow is split into three independent repositories, cloned as siblings:

```
web-api-expense-flow/    ← Node.js 20 + Fastify + TypeScript
web-expense-flow/        ← React 18 + Vite + MUI
db-expense-flow/         ← Flyway migrations and seeds
```

Each repo has its own devcontainer, docker-compose, `.github/workflows/ci.yml`, and Helm chart.

### Local development model

Each repo has its own devcontainer. For full local development, clone all three repos as siblings and use the API repo's docker-compose, which mounts migrations from the sibling db repo.

**API repo docker-compose services:**
- **db** — SQL Server 2022 (Developer edition) on port 1433
- **db-init** — creates the `ExpenseFlowDb` database on first run
- **flyway** — runs versioned migrations from `../db-expense-flow/migrations`
- **backend** — Fastify API on port 8080

**Frontend repo docker-compose services:**
- **frontend** — Vite dev server on port 3000 (backend must be running separately)

**DB repo docker-compose services (standalone, for migration development):**
- **db** — SQL Server 2022 on port 1433
- **db-init** — creates database
- **flyway** — runs migrations from `./migrations`

## Identity design

**SPA:** Azure Entra OIDC via `framework-react-core` (MSAL). Config loaded from `public/static-config.json` — `clientId` and `authority` never hardcoded.

**API:** JWT Bearer validation — `algorithms: ['RS256']`, `issuer` and `audience` from environment variables. Every route except `/health` and `/health/ready` requires a valid token.

**RBAC:** Role stored in `dbo.UserRoles`. Roles: `employee`, `manager`, `finance`, `admin`. Role checked per-route via `requireScope` middleware after auth.

Suggested auth-related tables:
- `dbo.Tenants` — company / organisation records
- `dbo.Users` — user profile, linked to Entra OID
- `dbo.UserRoles` — user ↔ role assignments per tenant
- `dbo.Departments` — department structure per tenant

## Domain entities
- `Tenant` — company/organisation with configuration and subscription
- `User` — employee with role assignment, linked to Entra identity
- `Department` — organisational unit for spend grouping
- `ExpensePolicy` — configurable rules: category limits, max amounts, required fields
- `ExpenseReport` — container for one submission period, owned by one user
- `ExpenseLineItem` — individual expense within a report: amount, category, date, notes
- `Receipt` — receipt image metadata and blob storage reference
- `Approval` — approval or rejection action by a manager on a report
- `Notification` — outbound email event log

## API route suggestions

All routes follow `GET|POST|PUT|PATCH|DELETE /api/v1/ResourceName` conventions.

```
GET    /api/v1/ExpenseReports              list current user's reports
POST   /api/v1/ExpenseReports              create a new report
GET    /api/v1/ExpenseReports/:id          get a specific report
PATCH  /api/v1/ExpenseReports/:id          update draft report
POST   /api/v1/ExpenseReports/:id/Submit   submit for approval
DELETE /api/v1/ExpenseReports/:id          delete a draft report

GET    /api/v1/ExpenseLineItems            list items for a report (query: reportId)
POST   /api/v1/ExpenseLineItems            add a line item
PUT    /api/v1/ExpenseLineItems/:id        update a line item
DELETE /api/v1/ExpenseLineItems/:id        remove a line item

POST   /api/v1/Receipts                    upload receipt image (multipart)
GET    /api/v1/Receipts/:id/Download       get a temporary SAS URL for a receipt

GET    /api/v1/Approvals                   list pending approvals (manager view)
POST   /api/v1/Approvals                   approve or reject a report
GET    /api/v1/Approvals/:id               get approval detail

GET    /api/v1/Users/Me                    current user profile
GET    /api/v1/Users                       list users (finance/admin only)

GET    /api/v1/Policies                    list active policies (finance/admin)
POST   /api/v1/Policies                    create policy rule
PUT    /api/v1/Policies/:id                update policy rule
DELETE /api/v1/Policies/:id                deactivate policy rule

GET    /api/v1/Reports/Spend               aggregated spend by category/period (finance)
GET    /api/v1/Reports/Export              CSV export of approved expenses (finance)
```

## Database standard
All DDL managed by Flyway in the `db-expense-flow` repo. Migrations use `V{major}.{minor}.{patch}__{description}.sql`. Views and stored procedures use `R__{name}.sql` repeatable migrations.

### `db-expense-flow/` structure (repo root)
```
db-expense-flow/
├── migrations/
│   ├── V1.0.0__create_schema.sql
│   ├── V1.0.1__create_tenants_users.sql
│   ├── V1.0.2__create_expense_tables.sql
│   └── V1.0.3__create_approvals_notifications.sql
├── seeds/
│   └── seed_reference_data.sql
├── .devcontainer/
│   └── devcontainer.json
├── docker-compose.yml
├── flyway.conf.example
└── README.md
```

## Infrastructure notes
- Azure Blob Storage: one container per tenant (`receipts-{tenantId}`) with SAS token access only
- No public blob URLs — all receipt downloads go through the API (`GET /api/v1/Receipts/:id/Download`)
- Email notifications via SMTP or SendGrid (configured via env vars) — no real-time requirements
- Redis not required for MVP; add in Phase 2 for approval queue and caching
