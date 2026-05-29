---
mode: agent
description: Convert a Lovable vibe-coded app into a full-stack scaffold — reads /lovable-conversions/<app-name>/, generates a plan directly from the source, and scaffolds three repos in /repos/. Skips the design/requirements phase.
tools:
  - codebase
  - editFiles
  - findFiles
  - runCommands
---

Convert the Lovable app **${input:appName}** into a full-stack scaffold using the fixed tech stack.

Read source from `/lovable-conversions/${input:appName}/`, generate a plan at `/plans/${input:appName}/PLAN.md` directly from the source (no requirements documents), then scaffold three repos in `/repos/`.

Pipeline: **source analysis → plan → scaffold**

---

## TECH STACK CONTEXT

All generated apps use a fixed stack. Do not carry over Lovable's tech choices into the output.

**Backend**: Node.js 20 + Fastify + TypeScript
**Frontend**: React 18 + Vite + TypeScript + MUI (Material UI) v6
**Database**: MSSQL (SQL Server) + Flyway versioned migrations
**Auth**: Azure Entra — OIDC for the SPA via `framework-react-core`; authentication handled at APIM; API reads forwarded identity headers `x-user-id`, `x-user-email`, `x-user-roles`
**Infra**: Docker + Docker Compose (local dev) → AKS + Helm (production)
**CI/CD**: GitHub Actions

**Standard API conventions:**
- URI versioning: all routes at `/api/v1/ResourceName`
- PascalCase plural resource names
- OpenAPI 3.0.3 spec at `docs/openapi.yaml`
- Auth middleware reads `x-user-id` / `x-user-email` / `x-user-roles` — no token libraries, no token validation
- Feature-based code organization: `src/features/<feature>/v1/`
- DB migrations: `V{major}.{minor}.{patch}__{description}.sql`
- All tables: `Id INT IDENTITY(1,1)`, `CreatedOn DATETIME2`, `ModifiedOn DATETIME2`

---

## STACK TRANSLATION REFERENCE

| Lovable / Supabase | Target stack |
|---|---|
| Supabase tables (`public.*`) | MSSQL tables (`dbo.*`) + Flyway migration file |
| Supabase auth (JWT, `auth.users`) | Azure Entra via APIM; API reads `x-user-id`, `x-user-email`, `x-user-roles` headers |
| Supabase Row Level Security | Fastify `requireScope(role)` middleware |
| `supabase.from(table)` client calls | Fastify API routes + parameterized MSSQL queries |
| Supabase Edge Functions | Fastify feature route handlers |
| Supabase Realtime / subscriptions | Deferred to post-MVP (note in Build Phases) |
| Supabase Storage | Azure Blob Storage — note if present |
| Tailwind CSS | MUI v6 `sx` prop or `styled()` |
| shadcn/ui components | MUI equivalents (`Button`, `Dialog`, `DataGrid`, `DatePicker`, etc.) |
| React Query / TanStack Query | Service layer (`src/services/<feature>Api.ts`) + component state |
| Zod (client-side) | Zod schemas in `<feature>.schema.ts` (backend validation) |
| `lucide-react` icons | MUI Icons (`@mui/icons-material`) |

---

## WORKFLOW

---

### PHASE 1 — ANALYZE THE LOVABLE SOURCE

#### Step 1 — Load the coding standards

Read all nine coding standards files before writing the plan. Every API endpoint, DB schema decision, and file structure must conform to these:
- `/specs/context/01-security.md`
- `/specs/context/02-code-quality.md`
- `/specs/context/03-api-standards.md`
- `/specs/context/04-db-migrations.md`
- `/specs/context/05-frontend.md`
- `/specs/context/06-framework.md`
- `/specs/context/07-testing.md`
- `/specs/context/08-accessibility.md`
- `/specs/context/09-tdd.md`

#### Step 2 — Read all source files

Read every file in `/lovable-conversions/${input:appName}/`. Process in this order:

1. **`README.md`** (if present) — app purpose and context
2. **`package.json`** — `description`, `dependencies`, and `devDependencies`
3. **`index.html`** — `<title>` tag
4. **Router / routes file** — typically `src/App.tsx`, `src/router.tsx`, or any file with `<Route>` elements; extract every route path and its page component
5. **`src/integrations/supabase/types.ts`** (if present) — authoritative data model; extract every table, column name, type, and relationship
6. **`supabase/migrations/`** (if present) — SQL files reveal indexes, constraints, and foreign keys; prefer these over inferred types
7. **All page components** — `src/pages/`, `src/views/`, or equivalent; for each page: purpose, data displayed, actions available, role restrictions
8. **Service files and hooks** — `src/services/`, `src/hooks/`, `src/lib/`, `src/api/`; these reveal what backend operations exist
9. **TypeScript types** — every `interface`, `type`, and `enum` across all `.ts` and `.tsx` files
10. **Auth / permission files** — role checks, route guards, access control; extract user roles and which pages/operations each role can access
11. **All remaining `.tsx` and `.ts` files** — catch any features not covered above

#### Step 3 — Extract technical intelligence

Compile the following before writing the plan. This is your ground truth — do not add features not visible in the source.

**A. App identity**
- App name and one-sentence description (from README, package.json, or page titles)
- Primary user workflow (the most common path through the app)

**B. Pages and navigation**
- Every distinct page: route path, component file, purpose, auth required (y/n), role restrictions
- Navigation structure (sidebar items, top nav, tabs)
- Any multi-step flows or modals that function as sub-pages

**C. Data model**
- Every entity (Supabase table or domain TypeScript interface)
- For each entity: field name, SQL type (map JS types → SQL types), nullable, default, constraints
- Relationships: foreign keys, cardinality, join tables
- Enum / lookup values (status fields, category fields, type fields)
- Use Supabase types / SQL migrations as authoritative; do not guess types from UI alone

**D. Features and API operations**
- Every CRUD operation and which entity it targets
- Every non-CRUD operation (approve, reject, assign, export, notify, etc.)
- Search, filter, sort, pagination patterns
- File upload/download (→ Azure Blob post-MVP if Supabase Storage)
- Dashboard or reporting aggregations
- Background or scheduled operations

**E. User roles and permissions**
- Every role defined in the app
- Per role: accessible pages, permitted operations
- Self-service vs. admin-only distinctions

**F. External integrations**
- Third-party APIs called (payment, email, maps, etc.)
- Webhooks or background jobs
- Supabase Storage usage (note for Azure Blob migration)

**G. Items to drop or defer**
- Supabase auth → replaced by Azure Entra / APIM headers; do not carry over
- Supabase Realtime → defer to post-MVP
- Lovable platform-specific configs → omit
- Supabase Storage → defer to post-MVP unless the app's core workflow requires it

---

### PHASE 2 — GENERATE THE PLAN

#### Step 4 — Create the plans directory

Create `/plans/${input:appName}/` if it does not exist.

#### Step 5 — Write PLAN.md

Create `/plans/${input:appName}/PLAN.md` with ALL of the following sections. Every section must be specific to ${input:appName} — derived from the source analysis above, not generic filler.

---

##### Overview
- App name and one-sentence description
- Source: `lovable-conversions/${input:appName}/` (converted from Lovable)
- Three repo names:
  - API: `web-api-${input:appName}`
  - Frontend: `web-${input:appName}`
  - DB: `db-${input:appName}`
- Output paths: `/repos/web-api-${input:appName}/`, `/repos/web-${input:appName}/`, `/repos/db-${input:appName}/`

---

##### Architecture Decisions
- **Auth**: Entra app registration for APIM; API reads `x-user-id`, `x-user-email`, `x-user-roles`; no token validation in source files. (Replaces Supabase auth from Lovable source.)
- **Database**: schema `dbo`, table strategy (one schema for all tables), index strategy derived from query patterns found in source
- **API structure**: feature groupings derived from source (name each group), versioning at `/api/v1/`
- **RBAC**: `requireScope(role)` middleware replacing Supabase RLS — list which roles map to which route groups
- **State / caching**: Redis if applicable (note if Lovable source had caching patterns)
- **Deferred from Lovable source**: list any Supabase Realtime, Storage, or Edge Function features being deferred and to which phase

---

##### Directory Structure

Show the COMPLETE file tree for all three repos. Expand every feature folder, page, and migration file. Use the actual feature names and page names from the Lovable source.

```
/repos/web-api-${input:appName}/
├── src/
│   ├── features/
│   │   └── <feature>/         ← one per feature group from source
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
│   └── spec/
│       └── PLAN.md
├── postman/
│   ├── collections/${input:appName}.json
│   └── environments/${input:appName}-local.postman_environment.json
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

/repos/db-${input:appName}/
├── migrations/
│   ├── V1.0.0__create_schema.sql
│   └── V1.0.1__create_<tables>.sql   ← actual table names from source
├── seeds/
├── docs/spec/
│   └── PLAN.md
├── .devcontainer/devcontainer.json
├── docker-compose.yml
├── flyway.conf.example
└── README.md

/repos/web-${input:appName}/
├── src/
│   ├── pages/
│   │   └── <PageName>/<PageName>.tsx  ← actual page names from source
│   ├── components/
│   ├── services/
│   │   └── <feature>Api.ts
│   ├── types/
│   │   └── <feature>.types.ts
│   └── router.tsx
├── public/static-config.json
├── docs/spec/
│   └── PLAN.md
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

##### API Endpoints

List EVERY endpoint. Group by feature module. For each endpoint:
- HTTP method + path (e.g., `POST /api/v1/Users`)
- One-line description
- Auth: protected? required role scope(s)?
- Request body fields (POST/PUT/PATCH): field name, type, required/optional, validation constraints
- Response shape: top-level fields and types
- All status codes: list every code the endpoint can return

Derive endpoints directly from the Lovable source — every `supabase.from(table).select/insert/update/delete()` call, every hook, every form submission becomes one or more endpoints here.

Include `GET /health` and `GET /health/ready` — unprotected, no scopes.

---

##### Database Schema

For each table (derived from Lovable entities in Step 3C):
- Table name: `dbo.TableName` (PascalCase)
- Columns: name, SQL type, nullable, constraints, default
- Indexes: name, columns, clustered/non-clustered
- Foreign key relationships

Every table MUST include:
```
Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id)
CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
ModifiedOn DATETIME2 NULL
```

Map Lovable/Supabase types → MSSQL:
- `text` / `varchar` → `NVARCHAR(n)` (choose appropriate length)
- `uuid` → `NVARCHAR(36)` or `UNIQUEIDENTIFIER`
- `boolean` → `BIT`
- `integer` / `int4` → `INT`
- `numeric` / `decimal` → `DECIMAL(p,s)`
- `timestamptz` / `timestamp` → `DATETIME2`
- `jsonb` → `NVARCHAR(MAX)` (note in schema comments)

List the exact Flyway migration files:
- `V1.0.0__create_schema.sql`
- `V1.0.1__create_<logical_group>.sql` (one per table or related group)
- `V1.0.2__seed_<data>.sql` (if lookup/reference data needed)

---

##### Frontend Pages and Components

For each page (derived from Lovable routes and page components in Step 3B):
- Route path
- TSX file path (`src/pages/<PageName>/<PageName>.tsx`)
- Auth: protected (requireAuth loader) or public
- Key MUI components (map from shadcn/Tailwind patterns found in source)
- Service calls: which `<feature>Api.ts` functions, which API endpoints
- Key state managed

List shared components to create in `src/components/` — derived from reusable components found in the Lovable source.

---

##### Helm Configuration

**`web-api-${input:appName}/helm/`:**
- `Chart.yaml`: `name: web-api-${input:appName}`, `description`
- `values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix: /api`
- `values-{env}.yaml`: `istio.hosts`; `azureWorkloadIdentityClientId: ""`

**`web-${input:appName}/helm/`:**
- `Chart.yaml`: `name: web-${input:appName}`, `description`
- `values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix: /`
- `values-{env}.yaml`: `istio.hosts`; `azureWorkloadIdentityClientId: ""`

---

##### Azure Entra Configuration

- App registration name suggestion
- Required API scopes (derived from role groupings found in source — used in `FRAMEWORK_UI_AUTH_SCOPES` and APIM policy)
- Frontend redirect URI: `http://localhost:3000/auth/callback` (dev)
- Note: auth validation is in APIM, not in the API. The API receives identity as `x-user-id`, `x-user-email`, `x-user-roles`.

---

##### Environment Variables

| Variable | Description | Example | Required |
|---|---|---|---|
| `DB_SERVER` | MSSQL server hostname | `localhost` | yes |
| `DB_DATABASE` | Database name | `${input:appName}Db` | yes |
| `DB_USER` | DB username | `sa` | yes |
| `DB_PASSWORD` | DB password | — | yes |
| `DB_PORT` | DB port | `1433` | yes |

Add any app-specific variables derived from the Lovable source (API keys for third-party integrations, feature flags, etc.).

---

##### TDD Contract

List every test file the scaffold must produce, with named `it()` case counts. `/create` treats this as a pre-condition — a missing test file means the scaffold is incomplete.

Format:
```
tests/unit/<feature>.service.test.ts    — N cases (n happy, n error, n not-found, n validation)
tests/unit/<feature>.routes.test.ts     — N cases (n 200/201/204, n 401, n 403, n 422, n 404)
test/unit/<PageName>.test.tsx           — N cases (n render, n loading, n empty, n error, n interaction)
```

Derive case counts from the endpoints in API Endpoints and pages in Frontend Pages above. Every service method, every route, every page must have a test file entry here.

---

##### Build Phases

**Phase 1 — MVP** (match the Lovable app's feature set exactly):

Numbered list of specific tasks. Test files must appear before their implementation counterparts:

Example ordering:
1. Write `tests/unit/<feature>.service.test.ts` with cases from TDD Contract
2. Write `tests/unit/<feature>.routes.test.ts` with cases from TDD Contract
3. Implement `<feature>.service.ts`
4. Implement `<feature>.routes.ts`
5. Create `V1.0.0__create_schema.sql`
6. Create `V1.0.1__create_<tables>.sql`
7. Write `test/unit/<PageName>.test.tsx`
8. Implement `src/pages/<PageName>/<PageName>.tsx`
9. (continue for every feature and page)

**Phase 2 — Deferred from Lovable source:**
List every feature that existed in the Lovable source but was deferred (Realtime, Storage, etc.) with a one-line description of what it would take.

**Phase 3 — Scale:**
Infrastructure, performance, advanced features beyond the Lovable prototype's scope.

---

##### Local Development Setup

```bash
# Clone all three repos as siblings
git clone <api-repo-url>      web-api-${input:appName}
git clone <frontend-repo-url> web-${input:appName}
git clone <db-repo-url>       db-${input:appName}

# Install deps
cd web-api-${input:appName} && npm install
cd ../web-${input:appName} && npm install

# Configure the API
cd ../web-api-${input:appName}
cp .env.example .env
# Edit .env — fill in DB_* and any app-specific vars

# Start SQL Server, create the database, run migrations
docker compose up -d db
docker compose run --rm db-init
docker compose run --rm flyway

# Configure frontend auth (local dev only)
# Edit web-${input:appName}/public/static-config.json — fill in ENTRA clientId and authority

# Start the API
docker compose up backend
# OR: npm run dev   (port 8080)

# Start the frontend
cd ../web-${input:appName}
docker compose up
# OR: npm run dev   (port 3000)
```

---

#### Step 6 — Plan confirmation

Output a summary confirming `PLAN.md` was written. List any assumptions made where the Lovable source was ambiguous, and any features deferred to Phase 2.

---

### PHASE 3 — SCAFFOLD THE REPOS

#### Step 7 — Scaffold all three repos

Read `.github/prompts/create.prompt.md` and execute every step it describes for **${input:appName}**, using the plan just written to `/plans/${input:appName}/PLAN.md`.

Note: `create.prompt.md` references `requirements/${input:appName}/TDD.md` for the test contract. Since there are no requirements documents in the convert pipeline, use the **TDD Contract section of `PLAN.md`** as the equivalent source of truth for named `it()` cases. The create prompt's Step 2 instruction to "also read TDD.md" should be satisfied by reading the TDD Contract section of `PLAN.md` instead.

This produces:
- `/repos/web-api-${input:appName}/`
- `/repos/web-${input:appName}/`
- `/repos/db-${input:appName}/`

---

### PHASE 4 — OUTPUT SUMMARY

#### Step 8 — Final report

List:
1. Plan file created and key decisions made
2. All files created across the three repos
3. Any Lovable features dropped (and why)
4. Any Lovable features deferred to Phase 2 (and what they need)
5. Any assumptions made where the Lovable source was ambiguous
