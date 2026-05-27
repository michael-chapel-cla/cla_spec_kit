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

**Three separate repositories per application:**
- `web-api-${input:appName}` — Fastify API (backend), cloned to `/repos/web-api-${input:appName}/`
- `web-${input:appName}` — React SPA (frontend), cloned to `/repos/web-${input:appName}/`
- `db-${input:appName}` — Flyway DB migrations, cloned to `/repos/db-${input:appName}/`

These repos are designed to be cloned as siblings in the same parent directory. The API repo's docker-compose mounts `../db-${input:appName}/migrations` for Flyway.

**API repo (`web-api-${input:appName}`):**
- Code organized by business feature: `src/features/<feature>/v1/` — never by technical layer
- All routes versioned: `/api/v{n}/ResourceName`
- Resource names: PascalCase plural nouns, no verbs, no hyphens/underscores
- Contract-first: `docs/openapi.yaml` exists before any route code is written
- Postman collection in `postman/collections/` + environment in `postman/environments/`
- Health endpoints: `GET /health`, `GET /health/ready` (unprotected)
- Own Helm chart at `helm/`
- Own devcontainer at `.devcontainer/`
- Own `docker-compose.yml` (references `../db-${input:appName}/migrations`)

**DB repo (`db-${input:appName}`):**
- Flyway migrations at `migrations/` (root of repo, not in a subdirectory)
- Naming: `V{major}.{minor}.{patch}__{description}.sql`
- Every table requires: `Id INT IDENTITY(1,1)` PK, `CreatedOn DATETIME2 DEFAULT SYSUTCDATETIME()`, `ModifiedOn DATETIME2 NULL`
- All strings: `NVARCHAR`, all booleans: `BIT`, all timestamps: `DATETIME2`
- Stored procedures/views: `R__{name}.sql` repeatable migrations
- Own `docker-compose.yml` (standalone, self-contained — no external volume dependencies)
- Own devcontainer at `.devcontainer/`

**Frontend repo (`web-${input:appName}`):**
- Service layer required: API calls in `src/services/<feature>Api.ts`, never in components
- All pages use MUI components
- Protected routes via `loader: requireAuth()` (from `framework-react-core`)
- Auth config: Entra `clientId` and `authority` in `public/static-config.json` — never hardcoded
- Own Helm chart at `helm/`
- Own devcontainer at `.devcontainer/`
- Own `docker-compose.yml` (frontend only — backend runs separately)

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

### Step 1 — Load the coding standards

Read all eight coding standards files before writing the plan. Every architectural decision, API design, DB schema, and file structure must conform to these rules — the `/create` agent will enforce them during scaffolding:
- `/specs/context/01-security.md` — security rules (S01–S43)
- `/specs/context/02-code-quality.md` — code quality rules (Q01–Q27)
- `/specs/context/03-api-standards.md` — API standards (A01–A30)
- `/specs/context/04-db-migrations.md` — DB migration rules (D01–D18)
- `/specs/context/05-frontend.md` — frontend rules (F01–F15)
- `/specs/context/06-framework.md` — framework usage rules (W01–W12)
- `/specs/context/07-testing.md` — testing rules (T01–T15)
- `/specs/context/08-accessibility.md` — accessibility rules (AX01–AX15)

### Step 2 — Read all requirements

Read every file in `/requirements/${input:appName}/`. Pay special attention to:
- `LLD.md` — directory structure, API routes, domain entities, devcontainer services
- `DATA_MODEL.md` — database tables and relationships
- `HLD.md` — architectural decisions and module boundaries
- `MVP_BUILD_SPEC.md` — what is in vs. out of scope for the first build

### Step 3 — Review the tech stack templates

Read the following to understand what must be customized:
- `/templates/framework-nodejs-starter-kit/package.json`
- `/templates/framework-react-starter-kit/package.json`
- `/templates/framework-nodejs-starter-kit/src/static-config.json`
- `/templates/framework-react-starter-kit/public/static-config.json`
- `/templates/helm/values.yaml`

### Step 4 — Create the plans directory

Create `/plans/${input:appName}/` if it does not exist.

### Step 5 — Write PLAN.md

Create `/plans/${input:appName}/PLAN.md` with ALL of the following sections:

---

#### Overview
- App name and one-sentence description
- Three repo names:
  - API: `web-api-${input:appName}`
  - Frontend: `web-${input:appName}`
  - DB: `db-${input:appName}`
- Output paths in spec kit:
  - `/repos/web-api-${input:appName}/`
  - `/repos/web-${input:appName}/`
  - `/repos/db-${input:appName}/`

---

#### Architecture Decisions
Document key technical choices:
- Auth strategy: Entra tenant/app registration approach, JWT validation library, how RBAC is implemented
- Database: schema name, multi-tenancy strategy if applicable, index strategy
- API structure: feature groupings, which endpoints share auth scopes, versioning approach
- State management / caching (Redis usage if any)
- Worker/background job approach if applicable
- Any deviations from the standard stack and why

---

#### Directory Structure

Show the COMPLETE file tree for all three repos. Expand every feature folder, page, and migration file:

```
/repos/web-api-${input:appName}/          ← API repo root
├── src/
│   ├── features/
│   │   └── <feature>/
│   │       └── v1/
│   │           ├── <feature>.routes.ts
│   │           ├── <feature>.service.ts
│   │           ├── <feature>.schema.ts
│   │           └── <feature>.types.ts
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
│   ├── ops/runbook.md
│   └── spec/               ← requirements + plan copied from spec-kit
├── postman/
│   ├── collections/<app-name>.json
│   └── environments/<app-name>-local.postman_environment.json
├── tests/
│   ├── unit/
│   └── integration/
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── values-{env}.yaml
├── .devcontainer/devcontainer.json
├── .env.example
├── docker-compose.yml
└── .github/workflows/ci.yml

/repos/db-${input:appName}/               ← DB repo root
├── migrations/
│   ├── V1.0.0__create_schema.sql
│   └── V1.0.1__create_<tables>.sql
├── seeds/
├── docs/spec/              ← requirements + plan copied from spec-kit
├── .devcontainer/devcontainer.json
├── docker-compose.yml
├── flyway.conf.example
└── README.md

/repos/web-${input:appName}/              ← Frontend repo root
├── src/
│   ├── pages/
│   │   └── <PageName>/<PageName>.tsx
│   ├── components/
│   ├── services/
│   │   └── <feature>Api.ts
│   ├── types/
│   │   └── <feature>.types.ts
│   └── router.tsx
├── public/static-config.json
├── docs/spec/              ← requirements + plan copied from spec-kit
├── test/unit/
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── values-{env}.yaml
├── .devcontainer/devcontainer.json
├── docker-compose.yml
└── .github/workflows/ci.yml
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

Group by feature module. Include `GET /health` and `GET /health/ready` — unprotected, no scopes.

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

Also list the exact Flyway migration files (these live in `db-${input:appName}/migrations/`):
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

#### Helm Configuration

Two Helm charts — one per non-DB repo. For each:

**`web-api-${input:appName}/helm/`:**
- `Chart.yaml`: `name: web-api-${input:appName}`, `description`
- `values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix` (e.g., `/api`)
- `values-{env}.yaml`: `istio.hosts` per environment; `azureWorkloadIdentityClientId: ""` placeholder

**`web-${input:appName}/helm/`:**
- `Chart.yaml`: `name: web-${input:appName}`, `description`
- `values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix` (e.g., `/`)
- `values-{env}.yaml`: `istio.hosts` per environment; `azureWorkloadIdentityClientId: ""` placeholder

---

#### Azure Entra Configuration

- App registration name suggestion
- Required API scopes (used in `FRAMEWORK_UI_AUTH_SCOPES` and JWT validation)
- Frontend redirect URI: `http://localhost:3000/auth/callback` (dev)
- Backend: `ENTRA_AUDIENCE` value
- Backend: `ENTRA_ISSUER` value

---

#### Environment Variables

List ALL environment variables required by the API backend:
| Variable | Description | Example | Required |
|---|---|---|---|
| `DB_SERVER` | MSSQL server hostname | `localhost` | yes |
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
- "Create `V1.0.0__create_schema.sql` in `db-${input:appName}/migrations/`"
- "Create `dbo.Users` table migration (V1.0.1)"
- "Implement `GET /api/v1/Users` route + service + schema + openapi entry"
- (etc. — every task is concrete and actionable)

**Phase 2 — Expansion:**
Features explicitly deferred from MVP.

**Phase 3 — Scale:**
Infrastructure, performance, advanced features.

---

#### Local Development Setup

Step-by-step commands for a developer starting from scratch. All three repos are assumed to be cloned as siblings in the same parent directory.

```bash
# 1. Clone all three repos as siblings
git clone <api-repo-url>      web-api-${input:appName}
git clone <frontend-repo-url> web-${input:appName}
git clone <db-repo-url>       db-${input:appName}

# 2. Install API deps
cd web-api-${input:appName} && npm install

# 3. Install frontend deps
cd ../web-${input:appName} && npm install

# 4. Create the API env file
cd ../web-api-${input:appName}
cp .env.example .env
# Edit .env — fill in DB_*, ENTRA_*, CORS_ORIGINS

# 5. Start SQL Server, create the database, and run migrations
#    (docker-compose in web-api reads ../db-${input:appName}/migrations)
docker compose up -d db
docker compose run --rm db-init
docker compose run --rm flyway

# 6. Configure frontend auth (local dev only)
# Edit web-${input:appName}/public/static-config.json — fill in ENTRA clientId and authority

# 7. Start the API backend
#    (from web-api-${input:appName}/)
docker compose up backend

# OR: run backend directly for faster dev loop
npm run dev   # starts on port 8080

# 8. Start the frontend
cd ../web-${input:appName}
docker compose up
# OR: npm run dev  # starts on port 3000
```

---

### Step 6 — Confirm completion

Output a summary confirming `PLAN.md` was created. List any open questions or assumptions that the `/create` agent will need to handle. Flag any requirements that were unclear or conflicting.
