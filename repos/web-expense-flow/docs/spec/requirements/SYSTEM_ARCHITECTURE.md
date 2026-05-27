# System Architecture — ExpenseFlow

## Architectural layers

```
┌─────────────────────────────────────────────────┐
│  Browser / Mobile                                │
│  React 18 SPA — MUI v6 — React Router v7        │
│  MSAL (framework-react-core) — Vite dev server  │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS — JWT Bearer
┌──────────────────▼──────────────────────────────┐
│  API Layer (AKS)                                 │
│  Fastify — Node.js 20 — TypeScript               │
│  Route → requireScope middleware → Service       │
│  JWT RS256 validation — Zod schema validation    │
└──────┬───────────────────┬────────────────────── ┘
       │                   │
┌──────▼──────┐    ┌───────▼──────────────────────┐
│  MSSQL       │    │  Azure Blob Storage           │
│  SQL Server  │    │  receipts-{tenantId}/         │
│  2022        │    │  SAS token access only        │
│  Flyway DDL  │    │  no public URLs               │
└─────────────┘    └──────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────┐
│  Notification Layer                              │
│  SMTP / SendGrid — async delivery                │
│  triggered by approval and status events         │
└─────────────────────────────────────────────────┘
```

## Component responsibilities

| Component | Responsibility |
|---|---|
| React SPA | UI rendering, MSAL token acquisition, form validation, receipt photo capture |
| Fastify API | Business logic, RBAC enforcement, policy evaluation, blob orchestration |
| MSSQL | Persistent state — all domain entities with TenantId isolation |
| Azure Blob | Receipt image storage — one container per tenant |
| Flyway | Schema lifecycle management — versioned DDL migrations |
| Helm / AKS | Kubernetes deployment — backend pods, autoscaling, ingress |
| Azure Entra | Identity provider — OIDC tokens for the SPA, RS256 JWTs for the API |

## Request flow — expense submission

```
1. Employee logs in → MSAL acquires JWT from Entra
2. Frontend POST /api/v1/ExpenseReports (with Bearer token)
3. Fastify validates JWT (RS256, issuer, audience)
4. requireScope('employee') confirms role from dbo.UserRoles
5. TenantId extracted from JWT claims — injected into every DB query
6. ExpenseReport row inserted → reportId returned
7. Employee uploads receipt → POST /api/v1/Receipts (multipart)
8. API streams blob to receipts-{tenantId}/ container
9. Receipt metadata (blobPath, contentType) stored in dbo.Receipts
10. Employee POST /api/v1/ExpenseReports/:id/Submit
11. Policy engine evaluates dbo.ExpensePolicies for tenant
12. If violations: 422 with structured error list
13. If clean: report status → Pending, Approval record created
14. Manager receives email notification (async via SMTP/SendGrid)
```

## Deployment topology

- **AKS**: Fastify API pods behind an ingress controller with TLS termination
- **Static hosting**: React SPA served from Azure Static Web Apps or CDN (no server-side rendering)
- **Database**: Azure SQL Managed Instance or SQL Server on AKS (developer edition in devcontainer)
- **Secrets**: Azure Key Vault — never in environment variable files committed to git
- **Config**: API reads `JWT_ISSUER`, `JWT_AUDIENCE`, `DB_SERVER`, `BLOB_ACCOUNT` from environment

## Multi-tenancy enforcement

Every table carries a `TenantId INT NOT NULL` column. The DB client layer (mssql pool wrapper) injects `TenantId` from the decoded JWT on every parameterized query. No query may omit the TenantId filter — this is enforced at the service layer, not left to individual route handlers.

## Non-functional properties

| Property | Design decision |
|---|---|
| Auth | RS256 JWT — stateless, no session store required |
| Tenancy | Row-level isolation via TenantId on all tables |
| Receipt access | SAS tokens only — no publicly addressable blob URLs |
| Notifications | Async SMTP/SendGrid — no real-time requirement |
| Scaling | Horizontal pod autoscaling on the API; DB connection pool |
| MVP caching | None — Redis deferred to Phase 2 |
| Observability | Structured JSON logs from Fastify — OpenTelemetry in Phase 2 |
