---
mode: agent
description: Generate the implementation plan for an application from its requirements documents.
tools:
  - codebase
  - editFiles
  - findFiles
---

Generate the implementation plan for **${input:appName}** based on its requirements.

---

## EMBEDDED STANDARDS REFERENCE

Apply these rules when designing the architecture and specifying API endpoints, DB schema, and file structure. The plan you produce will be consumed directly by the `/create` agent — it must be specific enough that no decisions are left to be made at scaffolding time.

---

### Architecture Constraints (Non-Negotiable)

**Backend:**
- Code organized by business feature: `src/features/<feature>/v1/` — never by technical layer
- All routes versioned: `/api/v{n}/ResourceName`
- Resource names: PascalCase plural nouns, no verbs, no hyphens/underscores (e.g., `/api/v1/UserProfiles`)
- Contract-first: `docs/openapi.yaml` exists before any route code is written
- Postman collection in `postman/collections/` with test scripts
- Health endpoints: `GET /health`, `GET /health/ready` (unprotected)

**Database:**
- Lives at `/repos/${input:appName}/db/` (sibling to `backend/` — not inside it)
- Flyway migrations in `db/migrations/`
- Naming: `V{major}.{minor}.{patch}__{description}.sql`
- Every table requires: `Id INT IDENTITY(1,1)` PK, `CreatedOn DATETIME2 DEFAULT SYSUTCDATETIME()`, `ModifiedOn DATETIME2 NULL`
- All strings: `NVARCHAR`, all booleans: `BIT`, all timestamps: `DATETIME2`
- Stored procedures/views: `R__{name}.sql` repeatable migrations

**Frontend:**
- Service layer required: API calls in `src/services/<feature>Api.ts`, never in components
- All pages use MUI components
- Protected routes via `loader: requireAuth()` (from `framework-react-core`)
- Auth config: Entra `clientId` and `authority` in `public/static-config.json` — never hardcoded

**Security requirements for every API:**
- JWT validation: `algorithms: ['RS256']`, `issuer` from env, `audience` from env
- Rate limiting: `@fastify/rate-limit` (100 req/min)
- Security headers: `@fastify/helmet`
- CORS: explicit origins from env (no `*`)
- No sensitive data in logs
- All DB calls: parameterized queries only

**Status code contracts:**
- POST creates resource → 201 + Location header
- DELETE → 204 No Content
- Validation errors → 422
- Auth missing → 401, Auth forbidden → 403, Not found → 404, Conflict → 409

---

## WORKFLOW

### Step 1 — Read all requirements

Read every file in `/requirements/${input:appName}/`. Pay special attention to:
- `LLD.md` — directory structure, API routes, domain entities, devcontainer services
- `DATA_MODEL.md` — database tables and relationships
- `HLD.md` — architectural decisions and module boundaries
- `MVP_BUILD_SPEC.md` — what is in vs. out of scope for the first build

### Step 2 — Review the tech stack templates

Read the following to understand what must be customized:
- `/templates/framework-nodejs-starter-kit/package.json`
- `/templates/framework-react-starter-kit/package.json`
- `/templates/framework-nodejs-starter-kit/src/static-config.json`
- `/templates/framework-react-starter-kit/public/static-config.json`
- `/helm/values.yaml`

### Step 3 — Create the plans directory

Create `/plans/${input:appName}/` if it does not exist.

### Step 4 — Write PLAN.md

Create `/plans/${input:appName}/PLAN.md` with ALL of the following sections:

---

#### Overview
- App name and one-sentence description
- Repo name (kebab-case)
- Target path: `/repos/${input:appName}/`

---

#### Architecture Decisions
Document key technical choices:
- Auth strategy: Entra tenant/app registration approach, which JWT validation library, how RBAC is implemented
- Database: schema name, multi-tenancy strategy if applicable, index strategy
- API structure: feature groupings, which endpoints share auth scopes, versioning approach
- State management / caching (Redis usage if any)
- Worker/background job approach if applicable
- Any deviations from the standard stack and why

---

#### Directory Structure

Show the COMPLETE file tree for `/repos/${input:appName}/`. Expand every feature folder and page:

```
/repos/${input:appName}/
├── backend/
│   ├── src/
│   │   ├── features/
│   │   │   └── <feature>/
│   │   │       └── v1/
│   │   │           ├── <feature>.routes.ts
│   │   │           ├── <feature>.service.ts
│   │   │           ├── <feature>.schema.ts
│   │   │           └── <feature>.types.ts
│   │   └── shared/
│   │       ├── auth/
│   │       │   ├── auth.middleware.ts
│   │       │   └── auth.types.ts
│   │       ├── db/
│   │       │   ├── db.client.ts
│   │       │   └── db.types.ts
│   │       └── errors/
│   │           └── error.handler.ts
│   ├── docs/
│   │   ├── openapi.yaml
│   │   └── ops/runbook.md
│   ├── postman/collections/<app-name>.json
│   └── tests/
│       ├── unit/
│       └── integration/
├── db/
│   ├── migrations/
│   │   ├── V1.0.0__create_schema.sql
│   │   └── V1.0.1__create_<tables>.sql
│   ├── seeds/
│   ├── flyway.conf.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── <PageName>/<PageName>.tsx
│   │   ├── components/
│   │   ├── services/
│   │   │   └── <feature>Api.ts
│   │   ├── types/
│   │   │   └── <feature>.types.ts
│   │   └── router.tsx
│   └── public/static-config.json
└── helm/
    ├── Chart.yaml
    ├── values.yaml
    ├── values-dev.yaml
    ├── values-qa.yaml
    ├── values-uat.yaml
    └── values-prd.yaml
```

---

#### API Endpoints

List EVERY endpoint. For each:
- HTTP method + path (e.g., `POST /api/v1/Users`)
- One-line description
- Auth: protected? required scope(s)?
- Request body fields (for POST/PUT/PATCH): field name, type, required/optional, validation constraints
- Response shape: top-level fields and types
- Status codes returned: list ALL expected codes (not just 200)

Group by feature module. Include the two health endpoints (`GET /health`, `GET /health/ready`) in their own section — unprotected, no scopes.

---

#### Database Schema

For each table:
- Table name: `dbo.TableName` (PascalCase)
- Columns: name, SQL type, nullable, constraints, default
- Indexes: name, columns, type (clustered/non-clustered)
- Foreign key relationships

Every table MUST include:
```
Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id)
CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
ModifiedOn DATETIME2 NULL
```

Also list the exact Flyway migration files:
- `V1.0.0__create_schema.sql` — schema creation
- `V1.0.1__create_<logical_group>.sql` — one file per table or related group
- `V1.0.2__seed_<data>.sql` — if reference/lookup data needed

---

#### Frontend Pages and Components

For each page:
- Route path (e.g., `/dashboard`)
- TSX file path (e.g., `src/pages/Dashboard/Dashboard.tsx`)
- Auth requirement: protected (requireAuth loader) or public
- Key MUI components used
- Service calls made: which `<feature>Api.ts` functions, which API endpoints
- Key state managed

Also list shared components to create in `src/components/`.

---

#### Helm Configuration Changes

List every value that changes from the template defaults:

**Chart.yaml:**
- `name`: app's kebab-case name
- `description`: app description

**values.yaml:**
- `app.name`
- `image.repository`
- `istio.pathPrefix`: `/<app-name>`
- `serviceAccount.name`

**values-dev.yaml:**
- `istio.hosts`: `["<app-name>.dev.<domain>"]`
- `serviceAccount.azureWorkloadIdentityClientId`: `""` ← placeholder, set at deploy time

**values-qa.yaml, values-uat.yaml, values-prd.yaml:**
- `istio.hosts` with appropriate environment hostname patterns

---

#### Azure Entra Configuration

- App registration name suggestion
- Required API scopes (used in `FRAMEWORK_UI_AUTH_SCOPES` and JWT validation)
- Frontend redirect URI: `http://localhost:3000/auth/callback` (dev)
- Backend: `ENTRA_AUDIENCE` value (usually the app registration client ID or a custom URI)
- Backend: `ENTRA_ISSUER` value (the Entra tenant token endpoint)

---

#### Environment Variables

List ALL environment variables required by the backend:
| Variable | Description | Example | Required |
|---|---|---|---|
| `DB_SERVER` | MSSQL server hostname | `mssql_server` | yes |
| `DB_DATABASE` | Database name | `AppDb` | yes |
| `DB_USER` | DB username | `sa` | yes |
| `DB_PASSWORD` | DB password | — | yes |
| `DB_PORT` | DB port | `1433` | yes |
| `ENTRA_ISSUER` | JWT issuer | `https://login.microsoftonline.com/<tenant>/v2.0` | yes |
| `ENTRA_AUDIENCE` | JWT audience | `<client-id>` | yes |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` | yes |
| (add app-specific vars from the requirements) | | | |

---

#### Build Phases

**Phase 1 — MVP** (aligned with `MVP_BUILD_SPEC.md`):
Numbered list of SPECIFIC tasks:
- "Create `V1.0.0__create_schema.sql` in `db/migrations/`"
- "Create `dbo.Users` table migration (V1.0.1)"
- "Implement `GET /api/v1/Users` route + service + schema + openapi entry"
- (etc. — every task is concrete and actionable)

**Phase 2 — Expansion:**
Features explicitly deferred from MVP.

**Phase 3 — Scale:**
Infrastructure, performance, advanced features.

---

#### Local Development Setup

Step-by-step commands for a developer starting from scratch:

```bash
# 1. Install backend deps
cd backend && npm install

# 2. Install frontend deps
cd ../frontend && npm install

# 3. Create environment file
cp backend/.env.example backend/.env
# Edit backend/.env — fill in DB_*, ENTRA_*, CORS_ORIGINS

# 4. Start SQL Server
docker compose --env-file backend/.env up -d db

# 5. Create database and run migrations
docker compose --env-file backend/.env run --rm db-init
docker compose --env-file backend/.env run --rm flyway migrate

# 6. Configure frontend auth (local dev only)
# Edit frontend/public/static-config.json — fill in ENTRA clientId and authority

# 7. Start backend
cd backend && npm run dev   # starts on port 8080

# 8. Start frontend
cd frontend && npm run dev  # starts on port 3000
```

---

### Step 5 — Confirm completion

Output a summary confirming `PLAN.md` was created. List any open questions or assumptions that the `/create` agent will need to handle. Flag any requirements that were unclear or conflicting.
