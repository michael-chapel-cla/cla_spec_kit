---
mode: agent
description: Generate a DEVELOPER_GUIDE.md in each of the three repos for an already-scaffolded application.
tools:
  - codebase
  - editFiles
  - findFiles
---

Generate developer guides for the application named **${input:appName}**.

---

## WORKFLOW

### Step 1 — Read the existing app

Read the following to understand what was built:

- `plans/${input:appName}/PLAN.md` — architecture decisions, endpoint list, DB schema, Helm config
- `repos/web-api-${input:appName}/.env.example` — all environment variables and their purpose
- `repos/web-api-${input:appName}/docs/openapi.yaml` — API contract
- `repos/web-api-${input:appName}/src/app.ts` — startup sequence and registered plugins
- All files under `repos/web-api-${input:appName}/src/features/` — feature list and structure
- `repos/web-${input:appName}/src/router.tsx` — all frontend routes and their auth requirements
- `repos/web-${input:appName}/public/static-config.json` — config fields the SPA needs at runtime
- `repos/db-${input:appName}/migrations/` — migration files, to understand the DB schema evolution

---

### Step 2 — Write `repos/web-api-${input:appName}/DEVELOPER_GUIDE.md`

This guide is for backend developers working in the API repo. Write it as if you are briefing someone who has never seen this codebase but is a competent Node.js/TypeScript developer.

Include the following sections, populated specifically for ${input:appName} — not generic filler:

#### Overview
One paragraph: what this repo does, what it is part of (three-repo model), and links to the two sibling repos (`web-${input:appName}` and `db-${input:appName}`).

#### Architecture at a glance
- Runtime: Node.js 20 + Fastify + TypeScript
- Auth: Azure Entra via APIM; identity forwarded to the API as trusted headers
- DB: MSSQL via `DbClient` singleton (connection pooled); all queries parameterised
- Feature structure: `src/features/<feature>/v1/` — types, schema, service, routes

Include a brief list of all features currently implemented (derived from `src/features/`).

#### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- Access to the sibling `db-${input:appName}` repo (cloned alongside this one)

#### Local development setup

Step-by-step instructions specific to this app:

```bash
# 1. Clone both repos as siblings
git clone <repo-url>/web-api-${input:appName}
git clone <repo-url>/db-${input:appName}

# 2. Install dependencies
cd web-api-${input:appName}
npm install

# 3. Start the DB (from the db repo)
cd ../db-${input:appName}
docker compose up -d

# 4. Copy and configure environment variables
cd ../web-api-${input:appName}
cp .env.example .env
# Edit .env — see Environment Variables section below

# 5. Start the API
npm run dev
# API available at http://localhost:8080
```

#### Environment variables

A table listing every variable from `.env.example`, what it does, and where to find the value. Be specific — do not write "see your Azure config"; write which Azure resource provides each value.

| Variable | Description | Where to get it |
|---|---|---|
| ... | ... | ... |

#### How authentication works

Explain specifically for ${input:appName}:
- The Entra app registration name/purpose
- Which routes are public vs. protected
- How `requireScope()` is used and which scopes exist in this app
- How APIM-forwarded identity headers are accessed in route handlers (`request.user`)

#### Adding a new feature

Concise steps using the `/iterate` command pattern:

1. Run `/iterate ${input:appName} <feature-name>` in the spec-kit repo to generate the scaffold
2. Copy the generated files into this repo
3. Register the route plugin in `src/app.ts`
4. Add the migration to `db-${input:appName}/migrations/`
5. Run `docker compose run flyway migrate` in the db repo
6. Add tests in `tests/unit/` and verify with `npm run test`

Or, if scaffolding manually, follow the pattern in any existing feature under `src/features/`.

#### Running the tests

```bash
npm run test              # unit tests only
npm run test:coverage     # with coverage report (must be ≥ 85%)
npm run test:integration  # requires the DB to be running
```

#### DB migrations

Migrations live in `db-${input:appName}/migrations/`. To apply:

```bash
cd ../db-${input:appName}
docker compose run flyway migrate
```

Naming convention: `V{major}.{minor}.{patch}__{description}.sql`. Never edit a migration that has already been applied — add a new one instead.

#### API reference

Full OpenAPI spec: `docs/openapi.yaml`. Import into Postman via `postman/collection.json`.

---

### Step 3 — Write `repos/web-${input:appName}/DEVELOPER_GUIDE.md`

This guide is for frontend developers working in the SPA repo.

Include:

#### Overview
One paragraph: what this SPA does, what it communicates with (the API repo), and a link to `web-api-${input:appName}`.

#### Architecture at a glance
- React 18 + Vite + TypeScript + MUI v6
- Auth: Azure Entra OIDC via `framework-react-core` (MSAL under the hood)
- API calls: all in `src/services/` — never inside components
- Routing: React Router v7 with `loader: requireAuth()` on every protected route

Include a list of all pages currently implemented (derived from `src/router.tsx`).

#### Prerequisites
- Node.js 20+
- The `web-api-${input:appName}` API running locally (see its DEVELOPER_GUIDE.md)

#### Local development setup

```bash
git clone <repo-url>/web-${input:appName}
cd web-${input:appName}
npm install

# Configure static-config.json
cp public/static-config.json.example public/static-config.json
# Edit static-config.json — see Configuration section below

npm run dev
# SPA available at http://localhost:3000
```

#### Configuration — `public/static-config.json`

A table listing every field in `static-config.json`, what it controls, and where to find the value:

| Field | Description | Where to get it |
|---|---|---|
| ... | ... | ... |

Values in this file are injected at deploy time by the CI pipeline — do not hardcode them in source.

#### How authentication works

Explain for ${input:appName}:
- The MSAL flow (`framework-react-core` handles token acquisition silently)
- The `/auth/callback` route purpose
- How `requireAuth()` works as a route loader and what happens on expiry
- How to access the current user in a component (`useAccount()` from `framework-react-core`)

#### Adding a new page

1. Create `src/pages/<PageName>/<PageName>.tsx` with a default export
2. Create `src/services/<feature>Api.ts` with typed API call functions
3. Create `src/types/<feature>.types.ts` with interfaces matching API response shapes
4. Add the route to `src/router.tsx` with `loader: requireAuth()`
5. Add a nav item in `public/static-config.json` under `navItems`

Follow the pattern of any existing page under `src/pages/`.

#### Running the tests

```bash
npm run test              # unit tests with React Testing Library
npm run test:coverage     # with coverage report (must be ≥ 85%)
```

---

### Step 4 — Write `repos/db-${input:appName}/DEVELOPER_GUIDE.md`

This guide is for developers who need to add or modify database migrations.

Include:

#### Overview
One paragraph: what database this repo manages, which app repos depend on it, and the sibling-clone requirement.

#### Architecture at a glance
- MSSQL (SQL Server) via Docker in local development
- Flyway for versioned migrations
- Migration files in `migrations/` — never edit an applied migration

#### Prerequisites
- Docker + Docker Compose

#### Local development setup

```bash
git clone <repo-url>/db-${input:appName}
cd db-${input:appName}
cp .env.example .env       # set DB_PASSWORD and DB_DATABASE
docker compose up -d       # starts SQL Server and runs Flyway automatically
```

#### Current schema

A summary of all tables currently defined (derived from reading the migration files):

| Table | Key columns | Purpose |
|---|---|---|
| ... | ... | ... |

#### Adding a migration

1. Find the highest version number in `migrations/` (e.g. `V1.0.4__...sql`)
2. Create the next file: `V1.0.5__<describe-the-change>.sql`
3. Follow these rules:
   - Wrap DDL in `IF NOT EXISTS` / `IF EXISTS` guards
   - All new tables must include: `Id INT IDENTITY(1,1) PRIMARY KEY`, `TenantId INT NOT NULL`, `CreatedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`, `ModifiedOn DATETIME2 NULL`
   - Data migrations must use `BEGIN TRANSACTION ... COMMIT`
   - Never use `SELECT *`
4. Apply the migration:
   ```bash
   docker compose run flyway migrate
   ```
5. Verify:
   ```bash
   docker compose run flyway info
   ```

#### Repeatable migrations

Stored procedures, views, and functions use repeatable migrations (`R__<name>.sql`). These re-run whenever their checksum changes. Place them in `migrations/` alongside versioned files.

---

### Step 5 — Confirm completion

After writing all three files, output a brief summary:

```
## Developer guides generated: ${input:appName}

### Files created
- repos/web-api-${input:appName}/DEVELOPER_GUIDE.md
- repos/web-${input:appName}/DEVELOPER_GUIDE.md
- repos/db-${input:appName}/DEVELOPER_GUIDE.md

### Assumptions made
[List any sections where information was inferred rather than read from existing files]
```
