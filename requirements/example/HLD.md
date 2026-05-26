# HLD — ExpenseFlow

## Product stance
ExpenseFlow is a **standalone SaaS product** with its own Entra app registration, dedicated database, and isolated deployment. It does not share infrastructure with other internal tools.

## Identity model
ExpenseFlow uses **Azure Entra** for authentication.

- Dedicated Entra app registration for ExpenseFlow
- OIDC login for the React SPA via `framework-react-core` (MSAL)
- JWT Bearer validation in the Fastify API (RS256, issuer, audience from env)
- RBAC stored in the application database — roles: `employee`, `manager`, `finance`, `admin`
- Role assignment managed within the app, not in Entra groups

## Overview
ExpenseFlow is a multi-tenant SaaS platform for employee expense management. Employees submit expenses and attach receipts; managers approve or reject through a simple queue; finance teams view aggregated spend and export data for payroll and accounting. Each tenant (company) has isolated data and configurable policies.

## Primary users
- **Employees** — submit expenses, track reimbursement status
- **Managers** — review and approve/reject team expense submissions
- **Finance admins** — view all company expenses, configure policies, export data
- **Company admins** — manage users, departments, and system settings

## Core capabilities
- Expense submission with receipt attachment
- Configurable approval workflows per company
- Policy enforcement: category limits, amount thresholds, required fields
- Finance reporting and CSV export
- Multi-tenant data isolation with per-company configuration
- Full audit trail for every expense action

## Runtime architecture
- React SPA served via static hosting (Azure Static Web Apps or CDN)
- Fastify API on Node.js 20 (AKS)
- MSSQL database with per-tenant row-level isolation (TenantId on all tables)
- Azure Blob Storage for receipt images (one container per tenant)
- No Redis required for MVP — add for caching and job queue in Phase 2

## Logical modules
1. Authentication and user management
2. Tenant and company configuration
3. Expense submission and receipt management
4. Approval workflow engine
5. Policy rule evaluation
6. Finance reporting and export
7. Notifications (email)

## Core flow
1. User signs in via Entra OIDC
2. Employee creates an expense report and adds line items with receipt photos
3. Employee submits the report — policy rules are evaluated at submission
4. If policy violations exist, employee is prompted to correct or provide justification
5. Report enters the approval queue for the employee's manager
6. Manager approves or rejects with optional comment
7. Finance admin sees approved reports, marks as reimbursed, exports to CSV
8. Employee receives notification at each status change

## Scale characteristics
- Moderate request volume: bursts at Monday morning (weekly submitters) and month-end
- Receipt images: moderate blob storage growth, not high-frequency streaming
- No real-time compute requirements — async notification delivery is acceptable

## Key risks and mitigations
| Risk | Mitigation |
|---|---|
| Receipt images stored insecurely | Azure Blob with SAS token access, no public URLs |
| PII in expense notes | Data retention policy, export controls for finance only |
| Approval chain misconfiguration | Fallback escalation rule if manager is unset |
| Tenant data leakage | TenantId filter on every query, enforced at db.client layer |
