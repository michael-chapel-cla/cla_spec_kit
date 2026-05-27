---
name: spec-kit-plan
description: Run /plan <app-name> — generate implementation plan from requirements docs
category: software-development
---

# Spec Kit — /plan Command

Run this when the user says "plan <app-name>" or "/plan <app-name>".

## Embedded Standards (Non-Negotiable)

### Architecture Constraints
**Backend:**
- Code organized by business feature: `src/features/<feature>/v1/` — never by technical layer
- All routes versioned: `/api/v{n}/ResourceName` (PascalCase plural, no verbs)
- Contract-first: `docs/openapi.yaml` exists before any route code
- Postman collection in `postman/collections/` with test scripts
- Health endpoints: `GET /health`, `GET /health/ready` (unprotected)

**Database:**
- Lives at `/repos/<app-name>/db/` (sibling to `backend/`)
- Flyway migrations: `V{major}.{minor}.{patch}__{description}.sql`
- Every table: `Id INT IDENTITY(1,1)` PK, `CreatedOn DATETIME2 DEFAULT SYSUTCDATETIME()`, `ModifiedOn DATETIME2 NULL`
- All strings: `NVARCHAR`, booleans: `BIT`, timestamps: `DATETIME2`
- Stored procedures/views: `R__{name}.sql` repeatable migrations

**Frontend:**
- Service layer: API calls in `src/services/<feature>Api.ts`, never in components
- All pages use MUI components
- Protected routes via `loader: requireAuth()` (from framework-react-core)
- Auth config: Entra clientId/authority in `public/static-config.json` — never hardcoded

**Security:**
- JWT validation: `algorithms: ['RS256']`, issuer/audience from env
- Rate limiting: `@fastify/rate-limit` (100 req/min)
- Security headers: `@fastify/helmet`
- CORS: explicit origins from env (no `*`)
- No sensitive data in logs, parameterized queries only

**Status codes:** POST → 201 + Location, DELETE → 204, validation → 422, auth missing → 401, forbidden → 403, not found → 404, conflict → 409

## Workflow

### Step 1 — Read all requirements
Read every file in `/requirements/<app-name>/`. Pay special attention to:
- `LLD.md` — directory structure, API routes, domain entities, devcontainer services
- `DATA_MODEL.md` — database tables and relationships
- `HLD.md` — architectural decisions, module boundaries
- `MVP_BUILD_SPEC.md` — in vs. out of scope

### Step 2 — Review templates
Read these to understand what must be customized:
- `/templates/framework-nodejs-starter-kit/package.json`
- `/templates/framework-react-starter-kit/package.json`
- `/templates/framework-nodejs-starter-kit/src/static-config.json`
- `/templates/framework-react-starter-kit/public/static-config.json`
- `/helm/values.yaml`

### Step 3 — Create plans directory
Create `/plans/<app-name>/` if it doesn't exist.

### Step 4 — Write PLAN.md
Create `/plans/<app-name>/PLAN.md` with ALL sections:

#### Overview
- App name, one-sentence description, repo name (kebab-case), target path `/repos/<app-name>/`

#### Architecture Decisions
- Auth strategy (Entra approach, JWT library, RBAC)
- Database (schema name, multi-tenancy strategy, index strategy)
- API structure (feature groupings, auth scopes, versioning)
- State management/caching (Redis usage)
- Worker/background job approach
- Any deviations from standard stack and why

#### Directory Structure
Show COMPLETE file tree for `/repos/<app-name>/`:
```
/repos/<app-name>/
├── backend/
│   ├── src/features/<feature>/v1/<feature>.routes.ts
│   ├── src/features/<feature>/v1/<feature>.service.ts
│   ├── src/shared/auth/auth.middleware.ts
│   ├── src/shared/db/db.client.ts
│   └── docs/openapi.yaml, ops/runbook.md, postman/collections/
├── db/migrations/V1.0.0__create_schema.sql
├── frontend/src/pages/<PageName>/<PageName>.tsx
└── helm/Chart.yaml, values*.yaml
```

#### API Endpoints
List EVERY endpoint: HTTP method + path, description, auth (protected? scopes?), request body fields (name, type, required/optional, validation), response shape, ALL expected status codes. Group by feature module. Include health endpoints (unprotected).

#### Database Schema
For each table: name (`dbo.TableName` PascalCase), columns (name, SQL type, nullable, constraints, default), indexes (name, columns, type), foreign keys. Every table MUST include `Id`, `CreatedOn`, `ModifiedOn`. List exact Flyway migration files.

#### Frontend Pages and Components
For each page: route path, TSX file path, auth requirement (protected/public), MUI components used, service calls (`<feature>Api.ts` functions + API endpoints), key state managed. List shared components for `src/components/`.

#### Helm Configuration Changes
List every value changing from template defaults: Chart.yaml (`name`, `description`), values.yaml (`app.name`, `image.repository`, `istio.pathPrefix`, `serviceAccount.name`), values-dev.yaml (`istio.hosts`, `azureWorkloadIdentityClientId` as empty placeholder), values-qa/uat/prd.yaml (`istio.hosts`).

#### Azure Entra Configuration
- App registration name suggestion
- Required API scopes (for `FRAMEWORK_UI_AUTH_SCOPES` and JWT validation)
- Frontend redirect URI: `http://localhost:3000/auth/callback` (dev)
- Backend `ENTRA_AUDIENCE` and `ENTRA_ISSUER` values

#### Environment Variables
Table: Variable | Description | Example | Required. Include DB_*, ENTRA_*, CORS_ORIGINS, plus app-specific vars.

#### Build Phases
- Phase 1 MVP: numbered list of SPECIFIC tasks (concrete, actionable)
- Phase 2 Expansion: features deferred from MVP
- Phase 3 Scale: infrastructure, performance, advanced features

#### Local Development Setup
Step-by-step commands: npm install (backend + frontend), `.env` setup, docker compose up db, flyway migrate, configure frontend auth, start backend (port 8080), start frontend (port 3000).

### Step 5 — Confirm
Output summary confirming PLAN.md created. List open questions/assumptions for `/create`. Flag unclear/conflicting requirements.
