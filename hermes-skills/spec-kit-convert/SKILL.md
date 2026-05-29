---
name: spec-kit-convert
description: Convert a Lovable vibe-coded app from /lovable-conversions/<app-name>/ into a full-stack scaffold — generates a plan directly from source and scaffolds three repos in /repos/. No design/requirements phase.
category: software-development
---

Convert the Lovable app **${input:appName}** into a full-stack scaffold using the fixed tech stack.

Read source from `/lovable-conversions/${input:appName}/`, generate a plan at `/plans/${input:appName}/PLAN.md` directly from the source (no requirements documents), then scaffold three repos in `/repos/`.

Pipeline: **source analysis → plan → scaffold → developer guides**

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
- Auth middleware reads `x-user-id` / `x-user-email` / `x-user-roles` — no token libraries, no token validation in source code
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

## EMBEDDED STANDARDS REFERENCE

These rules are non-negotiable. Every file you generate must conform to them.

### API STRUCTURE

**API repo root structure — MUST follow exactly:**
```
web-api-<app-name>/
├── docs/
│   ├── openapi.yaml            ← OpenAPI 3.0.3 — written before implementation
│   ├── ops/
│   │   └── runbook.md
│   └── spec/
│       └── PLAN.md             ← copy of plans/<app-name>/PLAN.md
├── postman/
│   ├── collections/
│   │   └── <app-name>.json
│   └── environments/
│       └── <app-name>-local.postman_environment.json
├── src/
│   ├── features/               ← Code organized by BUSINESS FEATURE, never by technical layer
│   │   └── <feature>/
│   │       └── v1/
│   │           ├── <feature>.routes.ts
│   │           ├── <feature>.service.ts
│   │           ├── <feature>.schema.ts
│   │           └── <feature>.types.ts
│   ├── shared/
│   │   ├── auth/
│   │   ├── db/
│   │   └── errors/
│   └── app.ts
├── tests/
│   ├── unit/
│   └── integration/
├── helm/
│   ├── Chart.yaml
│   └── values*.yaml
├── .devcontainer/
│   └── devcontainer.json
├── .env.example
├── docker-compose.yml
└── .github/
    └── workflows/
        └── ci.yml
```

**NEVER** use top-level: `controllers/`, `services/`, `repositories/`, `handlers/`, `middleware/` — these are non-compliant.

**URI versioning — MANDATORY on every route:**
- Format: `/api/v1/ResourceName`
- ❌ `/api/users`, `/users`
- ✅ `/api/v1/Users`, `/api/v2/Orders`

**Resource naming — PascalCase plural nouns, NO verbs:**
- ✅ `GET /api/v1/Users`, `GET /api/v1/UserProfiles`, `GET /api/v1/OrderItems`
- ❌ `/api/v1/users`, `/api/v1/user-profiles`, `/api/v1/getUsers`

**HTTP method contracts:**
| Method | Returns | Idempotent |
|--------|---------|------------|
| GET    | 200 | yes — MUST NOT modify state |
| POST   | **201 + Location header** | no |
| PUT    | 200 or 204 | yes |
| PATCH  | 200 + updated resource | no |
| DELETE | **204 No Content** | yes |

**Specific status codes — never generic:**
```
2XX: 200 GET/PUT/PATCH, 201 POST (with Location), 204 DELETE
4XX: 400 bad syntax, 401 missing/invalid auth, 403 forbidden,
     404 not found, 409 conflict, 422 validation errors, 429 rate limited
5XX: 500 unexpected, 502 bad gateway, 503 unavailable, 504 timeout
```

**Standard error response — every error must match exactly:**
```typescript
{
  error: "ERROR_CODE",
  message: "Human-readable message — never expose stack traces or internals",
  details: [{ field: "email", message: "Invalid email format" }],
  timestamp: "2026-03-27T12:00:00Z",
  requestId: "uuid"
}
```

**Centralized error handler:**
```typescript
app.setErrorHandler((err, req, reply) => {
  req.log.error({ err, requestId: req.id }, 'Request failed');
  const statusCode = err.statusCode ?? 500;
  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'INTERNAL_ERROR' : (err.code ?? 'REQUEST_ERROR'),
    message: statusCode >= 500 ? 'An unexpected error occurred.' : err.message,
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
});
```

**JSON formatting:**
- All property names: camelCase (`userId`, `firstName`, `createdAt`)
- All dates: ISO 8601 with timezone (`2026-03-27T12:00:00Z`)
- Omit optional fields — never return `null` for optional properties

**Health endpoints — required, unprotected:**
```
GET /health        → { "status": "HEALTHY", "timestamp": "...", "checks": { "database": "UP" } }
GET /health/ready  → Kubernetes readiness probe
```

---

### AUTH — APIM-FORWARDED IDENTITY HEADERS

Authentication is handled by Azure API Management before requests reach the API. APIM forwards verified identity as trusted headers. The API reads these headers only — it never performs token validation.

```typescript
// ✅ auth.middleware.ts — read APIM-forwarded headers only
export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const userId    = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  const userRoles = req.headers['x-user-roles'];

  if (!userId || !userEmail) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Missing identity headers',
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }

  req.user = {
    id: String(userId),
    email: String(userEmail),
    roles: userRoles ? String(userRoles).split(',') : [],
  };
}
```

Also export `requireScope(...roles)` which calls `authMiddleware` then checks `req.user.roles` against the required roles, returning 403 if unmet.

Apply `authMiddleware` to all routes except `GET /health` and `GET /health/ready`.

**NEVER** import `jsonwebtoken`, `@azure/msal-node`, or any other token validation library in API source files.

---

### SECURITY

**S03 — No hardcoded secrets:**
```typescript
❌ const apiKey = 'sk_live_abc123';
✅ const apiKey = process.env['API_KEY']!;
```
Covers: API keys, DB passwords, Entra clientId/secret, connection strings.
Helm values: leave all secret values as `""` with a comment — never a literal value.

**S04 — Parameterized queries only:**
```typescript
❌ db.query(`SELECT * FROM Users WHERE Id = '${userId}'`);
✅ request.input('id', sql.Int, userId).query('SELECT UserId, Email FROM dbo.Users WHERE UserId = @id');
```

**S12 — No stack traces in API responses.**

**S16 — Rate limiting required:**
```typescript
await app.register(rateLimit, { max: 100, timeWindow: '1 minute', keyGenerator: (req) => req.ip });
```

**S18 — Security headers required:**
```typescript
await app.register(helmet, { contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] } } });
```

**S10 — React XSS:**
```tsx
❌ <div dangerouslySetInnerHTML={{ __html: userContent }} />
✅ <div>{userContent}</div>
```

---

### CODE QUALITY

**No TypeScript `any`.** **`const` for all immutable variables. Strict equality (`===`). Early returns over deep nesting.**

**No `console.log`** — use `fastify.log` or `req.log`.

**DB connection pool — create once at startup:**
```typescript
const pool = await new sql.ConnectionPool({ ...config }).connect();
// Reuse pool — never open/close per request
```

**Test coverage: 85% lines, 80% branches, 85% functions.**

**React rules:**
- API calls in `src/services/` only — never directly in components
- List keys must be stable unique IDs — never array index
- `useEffect` dependency arrays must include all dependencies

---

### DB MIGRATIONS (FLYWAY)

**Naming — MANDATORY:**
```
V{major}.{minor}.{patch}__{description}.sql   ← versioned, runs once
R__{description}.sql                           ← repeatable (views, procs, functions)

✅ V1.0.0__create_schema.sql
❌ V1_initial_schema.sql   ← single underscore
❌ v1__schema.sql          ← lowercase v
```

**NEVER edit an applied migration.** Create a new file to fix bugs.

**SQL type standards:**
```sql
Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id)
CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
ModifiedOn DATETIME2 NULL
Name       NVARCHAR(200) NOT NULL
Enabled    BIT NOT NULL DEFAULT 1
```

**Map Lovable/Supabase types → MSSQL:**
- `text` / `varchar` → `NVARCHAR(n)`
- `uuid` → `NVARCHAR(36)` or `UNIQUEIDENTIFIER`
- `boolean` → `BIT`
- `integer` / `int4` → `INT`
- `numeric` / `decimal` → `DECIMAL(p,s)`
- `timestamptz` / `timestamp` → `DATETIME2`
- `jsonb` → `NVARCHAR(MAX)`

---

## WORKFLOW

---

### PHASE 1 — ANALYZE THE LOVABLE SOURCE

#### Step 1 — Load the coding standards

Read all nine coding standards files before writing anything. Every API endpoint, DB schema decision, and file structure must conform to these:
- `/specs/context/01-security.md` — security rules (S01–S43)
- `/specs/context/02-code-quality.md` — code quality rules (Q01–Q27)
- `/specs/context/03-api-standards.md` — API standards (A01–A30)
- `/specs/context/04-db-migrations.md` — DB migration rules (D01–D18)
- `/specs/context/05-frontend.md` — frontend rules (F01–F15)
- `/specs/context/06-framework.md` — framework usage rules (W01–W12)
- `/specs/context/07-testing.md` — testing rules (T01–T15)
- `/specs/context/08-accessibility.md` — accessibility rules (AX01–AX15)
- `/specs/context/09-tdd.md` — TDD guardrails (TD01–TD08)

#### Step 2 — Read all source files

Read every file in `/lovable-conversions/${input:appName}/`. Process in this order:

1. **`README.md`** (if present) — app purpose and context
2. **`package.json`** — `description`, `dependencies`, `devDependencies`
3. **`index.html`** — `<title>` tag
4. **Router / routes file** — typically `src/App.tsx`, `src/router.tsx`, or any file with `<Route>` elements; extract every route path and its page component
5. **`src/integrations/supabase/types.ts`** (if present) — authoritative data model; extract every table, column name, type, and relationship
6. **`supabase/migrations/`** (if present) — SQL files reveal indexes, constraints, foreign keys; prefer these over inferred types
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
- File upload/download (→ note Azure Blob post-MVP if Supabase Storage used)
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

#### Step 4 — Review the tech stack templates

Read the following to understand what must be customized:
- `/templates/framework-nodejs-starter-kit/package.json`
- `/templates/framework-react-starter-kit/package.json`
- `/templates/framework-nodejs-starter-kit/src/static-config.json`
- `/templates/framework-react-starter-kit/public/static-config.json`
- `/templates/helm/values.yaml`

#### Step 5 — Create the plans directory

Create `/plans/${input:appName}/` if it does not exist.

#### Step 6 — Write PLAN.md

Create `/plans/${input:appName}/PLAN.md` with ALL of the following sections. Every section must be specific to ${input:appName} — derived from the source analysis above, not generic filler.

---

##### Overview
- App name and one-sentence description
- Source: `lovable-conversions/${input:appName}/` (converted from Lovable — no requirements documents)
- Three repo names:
  - API: `web-api-${input:appName}`
  - Frontend: `web-${input:appName}`
  - DB: `db-${input:appName}`
- Output paths: `/repos/web-api-${input:appName}/`, `/repos/web-${input:appName}/`, `/repos/db-${input:appName}/`

---

##### Architecture Decisions
- **Auth**: Entra app registration for APIM; API reads `x-user-id`, `x-user-email`, `x-user-roles`; no token validation in source files. (Replaces Supabase auth from Lovable source.)
- **Database**: schema `dbo`, table strategy, index strategy derived from query patterns found in source
- **API structure**: feature groupings derived from source (name each group), versioning at `/api/v1/`
- **RBAC**: `requireScope(role)` middleware replacing Supabase RLS — list which roles map to which route groups
- **State / caching**: Redis if applicable
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
- All status codes the endpoint can return

Derive endpoints from the Lovable source — every `supabase.from(table).select/insert/update/delete()`, hook, and form submission becomes one or more endpoints.

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

List the exact Flyway migration files:
- `V1.0.0__create_schema.sql`
- `V1.0.1__create_<logical_group>.sql`
- `V1.0.2__seed_<data>.sql` (if reference/lookup data needed)

---

##### Frontend Pages and Components

For each page (derived from Lovable routes and page components in Step 3B):
- Route path
- TSX file path (`src/pages/<PageName>/<PageName>.tsx`)
- Auth: protected (requireAuth loader) or public
- Key MUI components (map from shadcn/Tailwind patterns found in source)
- Service calls: which `<feature>Api.ts` functions, which API endpoints
- Key state managed

List shared components to create in `src/components/`.

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
- Required API scopes (derived from role groupings — used in `FRAMEWORK_UI_AUTH_SCOPES` and APIM policy)
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

**This section is the test contract for the scaffold phase.** Since there are no requirements documents in the convert pipeline, the scaffold phase reads this section instead of `requirements/TDD.md`.

List every test file the scaffold must produce, with named `it()` case counts:

```
tests/unit/<feature>.service.test.ts    — N cases (n happy, n error, n not-found, n validation)
tests/unit/<feature>.routes.test.ts     — N cases (n 200/201/204, n 401, n 403, n 422, n 404)
test/unit/<PageName>.test.tsx           — N cases (n render, n loading, n empty, n error, n interaction)
```

For each service method list named it() cases:
- returns [expected] when [happy path]
- returns empty array when not found
- throws 404 when resource does not exist
- throws 422 when [validation condition]
- throws 409 when [conflict condition]
- propagates DB errors

For each route list named it() cases:
- `GET /api/v1/Resources` — 200 with [shape] for authenticated user; 401 when identity headers missing; 403 when user lacks role
- `POST /api/v1/Resources` — 201 with Location header when valid; 422 when required field missing; 409 when conflict; 401 when not authenticated
- (repeat for every endpoint)

For each page list named it() cases:
- displays loading indicator while data is fetching
- displays [key element] after successful load
- displays empty state when list is empty
- displays error message when fetch fails
- clicking [button] triggers [outcome]
- all form fields have associated labels
- action buttons have accessible names

Coverage targets: lines ≥ 85%, branches ≥ 80%, functions ≥ 85%.

---

##### Build Phases

**Phase 1 — MVP** (match the Lovable app's feature set exactly):

Numbered list of specific tasks. **Test files must appear before their implementation counterparts:**

1. Write `tests/unit/<feature>.service.test.ts` with cases from TDD Contract above
2. Write `tests/unit/<feature>.routes.test.ts` with cases from TDD Contract above
3. Implement `<feature>.service.ts` to satisfy service test contract
4. Implement `<feature>.routes.ts` to satisfy route test contract
5. Create `V1.0.0__create_schema.sql`
6. Create `V1.0.1__create_<tables>.sql`
7. Write `test/unit/<PageName>.test.tsx` with cases from TDD Contract above
8. Implement `src/pages/<PageName>/<PageName>.tsx`
9. (continue for every feature and page)

**Phase 2 — Deferred from Lovable source:**
List every feature that existed in the Lovable source but was deferred, with what it would take.

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

#### Step 7 — Plan confirmation

Output a summary confirming `PLAN.md` was written. List assumptions made where the Lovable source was ambiguous, and any features deferred to Phase 2.

---

### PHASE 3 — SCAFFOLD THE REPOS

#### Step 8 — Create the three output directories

Create these three sibling directories under `/repos/`:
- `/repos/web-api-${input:appName}/`
- `/repos/web-${input:appName}/`
- `/repos/db-${input:appName}/`

---

#### Step 9 — Scaffold the API repo (`web-api-${input:appName}`)

**IMPORTANT: Always start from the template. Never create API files from scratch.**

**9a.** Copy the entire contents of `/templates/framework-nodejs-starter-kit/` into `/repos/web-api-${input:appName}/`.

**9b.** Customize copied files:
- `package.json`: set `name` to `web-api-${input:appName}`, set `description`
- `src/static-config.json`: set `FRAMEWORK_HTTP_PORT` to `8080`
- `README.md`: replace TODO content with app name, local dev steps, link to `docs/openapi.yaml`
- `.github/workflows/ci.yml`: replace all occurrences of `templateweb` with `web-api-${input:appName}`
- Create `.env.example` with one entry per environment variable from PLAN.md. Use realistic but non-functional placeholder values with an inline comment for each:

```bash
# Database — SQL Server connection
DB_SERVER=localhost
DB_DATABASE=AppNameDb
DB_USER=sa
DB_PASSWORD=Change_Me_123!
DB_PORT=1433

# (add any app-specific variables from PLAN.md below this line)
```

**9c.** Create `docs/openapi.yaml` — **write this BEFORE any route code** (contract-first). Every endpoint from PLAN.md must appear here:

```yaml
openapi: 3.0.3
info:
  title: <App Name> API
  version: 1.0.0
  description: <one-sentence description from PLAN.md>
servers:
  - url: http://localhost:8080
    description: Local development
components:
  schemas:
    Error:
      type: object
      required: [error, message, timestamp, requestId]
      properties:
        error: { type: string, example: VALIDATION_ERROR }
        message: { type: string }
        timestamp: { type: string, format: date-time }
        requestId: { type: string, format: uuid }
        details:
          type: array
          items:
            type: object
            properties:
              field: { type: string }
              message: { type: string }
    # One schema per entity from PLAN.md — include all fields with types, formats, and required[]
paths:
  /health:
    get:
      summary: Liveness probe
      operationId: getHealth
      tags: [Health]
      responses:
        '200':
          description: Service is healthy
  # One path block per endpoint from PLAN.md
```

Every non-health path: `operationId`, `tags`, full `parameters`, `requestBody` (POST/PUT/PATCH), and responses for ALL expected status codes. 201 responses include a `Location` header. All error responses use `$ref: '#/components/schemas/Error'`.

**9d.** Create `src/shared/auth/auth.middleware.ts` — reads APIM-forwarded identity headers (`x-user-id`, `x-user-email`, `x-user-roles`). Returns 401 if required headers are absent. Also export `requireScope(...roles)` which calls `authMiddleware` then checks `req.user.roles` against required roles, returning 403 if unmet.

**9e.** Create `src/shared/db/db.client.ts` — mssql ConnectionPool created once at startup; typed `executeQuery(sql, params)` helper; parameterized queries only; config from env.

**9f.** Create `src/shared/errors/error.handler.ts` — centralized Fastify error handler.

**9g.** Register on app startup: `@fastify/helmet`, `@fastify/rate-limit` (100/min).

**9h.** Write backend test files FIRST. Before creating any feature source files, write the test files for every feature using the named cases from the **TDD Contract section of PLAN.md** (not from a requirements/TDD.md file — that file does not exist in the convert pipeline). Each test file must contain the named `it()` blocks from the TDD Contract — not empty stubs:

For service tests (`tests/unit/<feature>.service.test.ts`):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { <Feature>Service } from '../../src/features/<feature>/v1/<feature>.service';

const mockDb = { executeQuery: vi.fn() };

describe('<Feature>Service', () => {
  let service: <Feature>Service;
  beforeEach(() => { vi.clearAllMocks(); service = new <Feature>Service(mockDb as any); });

  describe('methodName(param1, param2)', () => {
    it('[happy path description from TDD Contract]', async () => {
      mockDb.executeQuery.mockResolvedValueOnce([{ /* expected shape */ }]);
      const result = await service.methodName(/* params */);
      expect(result).toBeDefined();
    });
    it('[not-found description from TDD Contract]', async () => {
      mockDb.executeQuery.mockResolvedValueOnce([]);
      await expect(service.methodName(/* params */)).rejects.toMatchObject({ statusCode: 404 });
    });
    it('[error propagation description from TDD Contract]', async () => {
      mockDb.executeQuery.mockRejectedValueOnce(new Error('DB error'));
      await expect(service.methodName(/* params */)).rejects.toThrow('DB error');
    });
    // ... remaining cases from TDD Contract
  });
});
```

For route tests (`tests/unit/<feature>.routes.test.ts`), include 401, 403, 404, and 422 cases as named in the TDD Contract.

Only after all test files are written, proceed to create the implementation files:

**9h-impl.** Create feature-based source structure. Implement the `docs/openapi.yaml` contract exactly. For each feature from PLAN.md:
- `<feature>.routes.ts` — Fastify plugin; applies auth middleware
- `<feature>.service.ts` — business logic; no framework dependencies; typed inputs/outputs; no `any`
- `<feature>.schema.ts` — Zod schemas matching openapi.yaml exactly
- `<feature>.types.ts` — TypeScript interfaces matching DB entities

**9i.** Create `docs/ops/runbook.md` — local dev setup, env var reference table, troubleshooting, and the following commands:

```bash
# Ensure db-${input:appName} is cloned as a sibling of this repo
# Clone: git clone <db-repo-url> ../db-${input:appName}

cp .env.example .env

docker compose up -d db
docker compose run --rm db-init
docker compose run --rm flyway
docker compose up
docker compose run --rm flyway validate
```

**9j.** Create Postman artifacts:
- `postman/collections/${input:appName}.json` — Postman collection v2.1; one request per endpoint; `pm.test(...)` scripts verifying status code and response shape; all requests use `{{baseUrl}}`
- `postman/environments/${input:appName}-local.postman_environment.json`:

```json
{
  "name": "${input:appName} — Local",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:8080", "type": "default", "enabled": true }
  ],
  "_postman_variable_scope": "environment"
}
```

**9k.** Add health check routes (`GET /health`, `GET /health/ready`) — no auth.

**9l.** Create `docker-compose.yml` at the API repo root:

```yaml
services:
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "${DB_PASSWORD}"
      MSSQL_PID: "Developer"
    ports:
      - "1433:1433"
    healthcheck:
      test: /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "${DB_PASSWORD}" -Q "SELECT 1" -b -o /dev/null -C
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  db-init:
    image: mcr.microsoft.com/mssql-tools
    depends_on:
      db:
        condition: service_healthy
    command: >
      /opt/mssql-tools/bin/sqlcmd -S db -U sa -P "${DB_PASSWORD}"
      -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${DB_DATABASE}') CREATE DATABASE [${DB_DATABASE}]"
    restart: on-failure

  flyway:
    image: flyway/flyway:10-alpine
    depends_on:
      db-init:
        condition: service_completed_successfully
    command: migrate
    volumes:
      - ../db-${input:appName}/migrations:/flyway/sql
    environment:
      FLYWAY_URL: "jdbc:sqlserver://db:1433;databaseName=${DB_DATABASE};encrypt=true;trustServerCertificate=true"
      FLYWAY_USER: "${DB_USER}"
      FLYWAY_PASSWORD: "${DB_PASSWORD}"
      FLYWAY_LOCATIONS: "filesystem:/flyway/sql"
      FLYWAY_BASELINE_ON_MIGRATE: "true"

  backend:
    build:
      context: .
      target: development
      args:
        NPM_TOKEN: "${NPM_TOKEN:-}"
    ports:
      - "8080:8080"
      - "9229:9229"
    volumes:
      - ./src:/opt/cla/src
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
```

**9m.** Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "${input:appName} API",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "postCreateCommand": "npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next",
        "redhat.vscode-yaml"
      ]
    }
  },
  "forwardPorts": [8080, 9229],
  "mounts": ["source=${localEnv:HOME}/.azure,target=/root/.azure,type=bind,consistency=cached"],
  "remoteUser": "node"
}
```

**9n.** Copy the Helm chart. Copy the entire contents of `/templates/helm/` into `/repos/web-api-${input:appName}/helm/`. Apply API-specific config from PLAN.md:
- `helm/Chart.yaml`: `name` → `web-api-${input:appName}`, `description`
- `helm/values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix` → `/api`, `serviceAccount.name`
- All `values-*.yaml`: env-specific `istio.hosts`; `azureWorkloadIdentityClientId` as empty placeholder

---

#### Step 10 — Scaffold the DB repo (`db-${input:appName}`)

Create the following structure at `/repos/db-${input:appName}/`:

```
db-${input:appName}/
├── migrations/
│   ├── V1.0.0__create_schema.sql      ← IF NOT EXISTS schema creation
│   └── V1.0.1__create_<tables>.sql    ← one file per table or logical group
├── seeds/
│   └── seed_reference_data.sql        ← if applicable
├── .devcontainer/
│   └── devcontainer.json
├── docker-compose.yml
├── flyway.conf.example
└── README.md
```

Create Flyway migration files per PLAN.md DB schema. Every table must include:
```sql
Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id)
CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
ModifiedOn DATETIME2 NULL
```

Create `flyway.conf.example` with placeholder values only (no real credentials).

Create `docker-compose.yml` for standalone DB + migration work:

```yaml
services:
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "${DB_PASSWORD}"
      MSSQL_PID: "Developer"
    ports:
      - "1433:1433"
    healthcheck:
      test: /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "${DB_PASSWORD}" -Q "SELECT 1" -b -o /dev/null -C
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  db-init:
    image: mcr.microsoft.com/mssql-tools
    depends_on:
      db:
        condition: service_healthy
    command: >
      /opt/mssql-tools/bin/sqlcmd -S db -U sa -P "${DB_PASSWORD}"
      -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${DB_DATABASE}') CREATE DATABASE [${DB_DATABASE}]"
    restart: on-failure

  flyway:
    image: flyway/flyway:10-alpine
    depends_on:
      db-init:
        condition: service_completed_successfully
    command: migrate
    volumes:
      - ./migrations:/flyway/sql
    environment:
      FLYWAY_URL: "jdbc:sqlserver://db:1433;databaseName=${DB_DATABASE};encrypt=true;trustServerCertificate=true"
      FLYWAY_USER: "${DB_USER}"
      FLYWAY_PASSWORD: "${DB_PASSWORD}"
      FLYWAY_LOCATIONS: "filesystem:/flyway/sql"
      FLYWAY_BASELINE_ON_MIGRATE: "true"
```

Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "${input:appName} DB",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "redhat.vscode-yaml",
        "ms-mssql.mssql"
      ]
    }
  },
  "forwardPorts": [1433],
  "remoteUser": "node"
}
```

Create `README.md` explaining the migration structure, how to run locally, and the naming convention.

---

#### Step 11 — Scaffold the frontend repo (`web-${input:appName}`)

**IMPORTANT: Always start from the template. Never create frontend files from scratch.**

**11a.** Copy the entire contents of `/templates/framework-react-starter-kit/` into `/repos/web-${input:appName}/`.

**11b.** Customize copied files:
- `package.json`: set `name` to `web-${input:appName}`
- `.github/workflows/ci.yml`: replace all occurrences of `templateweb` with `web-${input:appName}`
- `public/static-config.json`:
  - `FRAMEWORK_UI_NAME`: app display name
  - `FRAMEWORK_UI_AUTH_ENTRA.clientId`: `""` — set at deploy
  - `FRAMEWORK_UI_AUTH_ENTRA.authority`: `""` — set at deploy
  - `FRAMEWORK_UI_AUTH_ENTRA.redirectUri`: `"http://localhost:3000/auth/callback"`
  - `FRAMEWORK_UI_NAVBAR`: nav items from PLAN.md
  - `FRAMEWORK_UI_AUTH_SCOPES`: required API scopes from PLAN.md
- `index.html`: set `<title>` to app display name

**11c.** Create source structure per PLAN.md:
```
src/
├── pages/<PageName>/<PageName>.tsx    ← one file per page
├── components/                         ← shared UI components
├── services/<feature>Api.ts            ← API calls (never in components)
├── types/<feature>.types.ts            ← TypeScript interfaces
└── router.tsx                          ← routes from PLAN.md
```

Every page: MUI components, service calls only, loading + error states, TypeScript types, protected via `loader: requireAuth()` unless explicitly public.

**11d.** Write frontend test files FIRST using the named cases from the **TDD Contract section of PLAN.md**. Before creating any page `.tsx` files, write `test/unit/<PageName>.test.tsx` for every page. The test file must contain the named `it()` blocks from the TDD Contract:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import <PageName> from '../../src/pages/<PageName>/<PageName>';

vi.mock('../../src/services/<feature>Api', () => ({
  <feature>Api: {
    list: vi.fn(),
    create: vi.fn(),
  }
}));

describe('<PageName>', () => {
  describe('Render', () => {
    it('[render description from TDD Contract]', async () => {
      render(<MemoryRouter><PageName /></MemoryRouter>);
      expect(await screen.findByRole('heading')).toBeInTheDocument();
    });
    it('shows loading indicator while data is fetching', () => {
      render(<MemoryRouter><PageName /></MemoryRouter>);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    it('shows empty state message when list is empty', async () => { /* from TDD Contract */ });
    it('shows error message when fetch fails', async () => { /* from TDD Contract */ });
  });

  describe('Interactions', () => {
    it('[interaction description from TDD Contract]', async () => { /* from TDD Contract */ });
  });

  describe('Accessibility', () => {
    it('all form fields have associated labels', () => { /* from TDD Contract */ });
    it('action buttons have accessible names', () => { /* from TDD Contract */ });
  });
});
```

Only after all frontend test files are written, proceed to create the page implementation files.

**11e.** Create `docker-compose.yml` at the frontend repo root:

```yaml
services:
  frontend:
    build:
      context: .
      target: base
      args:
        NPM_TOKEN: "${NPM_TOKEN:-}"
    ports:
      - "3000:3000"
    volumes:
      - ./src:/opt/cla/src
      - ./public:/opt/cla/public
    environment:
      NODE_ENV: development
      VITE_API_URL: "http://localhost:8080"
```

**11f.** Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "${input:appName}",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "postCreateCommand": "npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next"
      ]
    }
  },
  "forwardPorts": [3000, 6006],
  "mounts": ["source=${localEnv:HOME}/.azure,target=/root/.azure,type=bind,consistency=cached"],
  "remoteUser": "node"
}
```

**11g.** Copy the Helm chart. Copy the entire contents of `/templates/helm/` into `/repos/web-${input:appName}/helm/`. Apply frontend-specific config from PLAN.md:
- `helm/Chart.yaml`: `name` → `web-${input:appName}`, `description`
- `helm/values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix` → `/`, `serviceAccount.name`
- All `values-*.yaml`: env-specific `istio.hosts`; `azureWorkloadIdentityClientId` as empty placeholder

---

#### Step 12 — Generate `.github/copilot-instructions.md` for each repo

**12a. API repo** — Create `/repos/web-api-${input:appName}/.github/copilot-instructions.md`:

Part 1 — App-specific header:
```markdown
# <App Display Name> API — Copilot Instructions

<One-sentence description of what this API does.>

## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + Fastify + TypeScript |
| Database | MSSQL (SQL Server) + Flyway migrations |
| Auth | Azure Entra via APIM; API reads APIM-forwarded identity headers |
| Local dev | Docker Compose |
| Deployment | AKS + Helm |

## Features (`src/features/<feature>/v1/`)
<list each feature with a one-line description>

## Database Tables
<list each table from PLAN.md with a one-line description>

## Key Files
- `docs/openapi.yaml` — API contract; update this BEFORE adding routes (contract-first)
- `.env.example` → `.env` — environment variable reference for local setup
- `docker-compose.yml` — local: SQL Server + Flyway + backend (Flyway reads ../db-${input:appName}/migrations)
- `postman/collections/${input:appName}.json` — API test collection
- `helm/` — Kubernetes deployment chart
```

Part 2 — Read the spec kit's `.github/copilot-instructions.md`. Copy every section from `## API Standards` through the end of the file verbatim. Do NOT copy spec-kit-specific content before that heading.

**12b. Frontend repo** — Create `/repos/web-${input:appName}/.github/copilot-instructions.md`:

Part 1 — App-specific header:
```markdown
# <App Display Name> — Copilot Instructions

<One-sentence description of what this SPA does.>

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| UI | MUI v6 |
| Auth | Azure Entra OIDC via framework-react-core (MSAL) |
| Local dev | Docker Compose |
| Deployment | AKS + Helm |

## Pages (`src/pages/`)
<list each page with its route and purpose>

## Services (`src/services/`)
<list each service file and which API endpoints it calls>

## Key Files
- `public/static-config.json` — Entra clientId/authority (never hardcode these values)
- `docker-compose.yml` — local: frontend dev server (backend runs separately from web-api-${input:appName})
- `helm/` — Kubernetes deployment chart
- Backend API: `web-api-${input:appName}` repo, runs on port 8080 locally
```

Part 2 — Same as above: copy from `## API Standards` through end of spec kit copilot-instructions.

**12c. DB repo** — Create `/repos/db-${input:appName}/.github/copilot-instructions.md`:

```markdown
# <App Display Name> DB — Copilot Instructions

Flyway migration scripts for the <App Name> application. These migrations are consumed by the `web-api-${input:appName}` backend via docker-compose volume mount.

## Migration Files (`migrations/`)
<list each migration file with its version and description>

## Rules
- NEVER edit an applied migration file — create a new versioned file instead
- Naming: `V{major}.{minor}.{patch}__{description}.sql` (double underscore, uppercase V)
- All tables: `Id INT NOT NULL IDENTITY(1,1)` PK, `CreatedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`, `ModifiedOn DATETIME2 NULL`
- All strings: `NVARCHAR`, all booleans: `BIT` (1/0 not true/false), all timestamps: `DATETIME2`
- Use `IF NOT EXISTS` guards for additive DDL
- Stored procedures and views → `R__{name}.sql` repeatable migrations
- Data migrations must use `BEGIN TRANSACTION / COMMIT` with verification before commit
- Never `SELECT *` in migrations
- `flyway.conf` must NOT be committed — only `flyway.conf.example`
```

---

#### Step 13 — Create READMEs for each repo

**13a.** `/repos/web-api-${input:appName}/README.md`:
```markdown
# <App Name> API

<One-line description>

## Structure
- `src/features/` — business feature modules (routes, service, schema, types)
- `docs/openapi.yaml` — API contract (contract-first — edit this before adding routes)
- `postman/` — API test collection and local environment file
- `helm/` — Kubernetes deployment chart

## Local development
See `docs/ops/runbook.md` for full setup steps.

**Requires `db-${input:appName}` cloned as a sibling directory.**

cp .env.example .env
docker compose up
```

**13b.** `/repos/web-${input:appName}/README.md`:
```markdown
# <App Name>

<One-line description>

## Structure
- `src/pages/` — one directory per page
- `src/services/` — API service modules (all API calls live here)
- `public/static-config.json` — Entra auth config (clientId/authority set at deploy)
- `helm/` — Kubernetes deployment chart

## Local development
The backend must be running from `web-api-${input:appName}` on port 8080.

docker compose up
```

**13c.** `/repos/db-${input:appName}/README.md`:
```markdown
# <App Name> DB

Flyway migration scripts for <App Name>. Consumed by `web-api-${input:appName}` via docker-compose.

## Structure
- `migrations/` — versioned SQL migrations (`V{major}.{minor}.{patch}__{description}.sql`)
- `seeds/` — reference data scripts (run manually, not via Flyway)
- `flyway.conf.example` — copy to `flyway.conf` and fill in credentials for local use

## Local development (standalone)
cp flyway.conf.example flyway.conf
docker compose up

## Adding a migration
Create a new file in `migrations/` — never edit an existing applied file.
```

---

#### Step 14 — Copy PLAN.md into each repo

Copy the plan into all three repos so developers have full background without needing access to the spec-kit. Note: there are no requirements documents in the convert pipeline.

- `plans/${input:appName}/PLAN.md` → `web-api-${input:appName}/docs/spec/PLAN.md`
- `plans/${input:appName}/PLAN.md` → `web-${input:appName}/docs/spec/PLAN.md`
- `plans/${input:appName}/PLAN.md` → `db-${input:appName}/docs/spec/PLAN.md`

---

#### Step 15 — Self-audit

Verify before reporting complete:

1. No hardcoded secrets in any repo (Entra clientId/secret, DB passwords as literal values)
2. Every API endpoint in PLAN.md has a route file, service file, and `docs/openapi.yaml` entry — with all required status codes, parameter schemas, and request body schemas
3. Every DB table in PLAN.md has a Flyway migration in `db-${input:appName}/migrations/`
4. Every frontend page in PLAN.md has a `.tsx` file
5. No `any` types in any TypeScript file
6. No `console.log` in any production code file
7. All SQL uses parameterized queries — no string concatenation
8. `@fastify/helmet` and `@fastify/rate-limit` registered in `app.ts`
9. Auth middleware reads `x-user-id` / `x-user-email` / `x-user-roles` headers — no token library imports, no token validation in any source file
10. Helm values have no leftover placeholder strings except those marked "set at deploy time" — applies to BOTH `web-api-${input:appName}/helm/` and `web-${input:appName}/helm/`
11. `flyway.conf` is NOT present in `db-${input:appName}/` — only `flyway.conf.example`
12. `web-api-${input:appName}/docker-compose.yml` mounts `../db-${input:appName}/migrations` for Flyway
13. `db-${input:appName}/docker-compose.yml` mounts `./migrations` (standalone, self-contained)
14. `web-${input:appName}/docker-compose.yml` contains only the frontend service
15. `.env.example` exists in `web-api-${input:appName}/` and contains every environment variable in PLAN.md
16. `.github/workflows/ci.yml` in both `web-api-${input:appName}/` and `web-${input:appName}/` has no remaining `templateweb` references
17. `.github/copilot-instructions.md` exists in all three repos with app-specific structure sections
18. `.devcontainer/devcontainer.json` exists in all three repos
19. `postman/environments/${input:appName}-local.postman_environment.json` exists in `web-api-${input:appName}/`
20. Every backend feature has a test file in `web-api-${input:appName}/tests/unit/` — must contain named `it()` blocks from the TDD Contract in PLAN.md
21. Every frontend page has a test file in `web-${input:appName}/test/unit/` — must contain render, state, and interaction cases from the TDD Contract in PLAN.md
22. Every service test covers happy path, not-found, and DB error cases (TD04)
23. Every route test covers 200/201/204, 401, and 422 cases at minimum (TD05)
24. `vitest.config.ts` in both API and frontend repos has `thresholds` set to ≥ 85 lines/functions, ≥ 80 branches (TD08)
25. `docs/spec/PLAN.md` exists in all three repos

Report any gaps found.

---

### PHASE 4 — GENERATE DEVELOPER GUIDES

#### Step 16 — Write `repos/web-api-${input:appName}/DEVELOPER_GUIDE.md`

Read `repos/web-api-${input:appName}/.env.example`, `docs/openapi.yaml`, `src/app.ts`, all files under `src/features/`, and `plans/${input:appName}/PLAN.md` before writing.

Include these sections, populated specifically for ${input:appName}:

**Overview** — what this repo does, the three-repo model, links to the two sibling repos.

**Architecture at a glance:**
- Runtime: Node.js 20 + Fastify + TypeScript
- Auth: Azure Entra via APIM; identity forwarded to the API as trusted headers (`x-user-id`, `x-user-email`, `x-user-roles`)
- DB: MSSQL via `DbClient` singleton (connection pooled); all queries parameterised
- Feature structure: `src/features/<feature>/v1/` — types, schema, service, routes
- List of all features implemented (derived from `src/features/`)

**Prerequisites:**
- Node.js 20+
- Docker + Docker Compose
- Access to the sibling `db-${input:appName}` repo (cloned alongside this one)

**Local development setup** — step-by-step specific to this app:
```bash
git clone <repo-url>/web-api-${input:appName}
git clone <repo-url>/db-${input:appName}
cd web-api-${input:appName} && npm install
cp .env.example .env
# Edit .env — see Environment Variables section below
npm run dev   # API at http://localhost:8080
```

**Environment variables** — table listing every variable from `.env.example`, what it does, and where to find the value. Be specific about which Azure resource provides each value.

| Variable | Description | Where to get it |
|---|---|---|
| ... | ... | ... |

**How authentication works:**
- The Entra app registration name and purpose
- Which routes are public vs. protected
- How `requireScope()` is used and which scopes exist in this app
- How APIM-forwarded identity headers are accessed in route handlers (`request.user`)
- Note: the API never validates tokens — APIM handles all auth before requests arrive

**Adding a new feature:**
1. Add the feature to `docs/openapi.yaml` first (contract-first)
2. Create `src/features/<feature>/v1/` with routes, service, schema, types
3. Write tests in `tests/unit/` before implementing
4. Register the route plugin in `src/app.ts`
5. Add the migration to `db-${input:appName}/migrations/`
6. Run `docker compose run --rm flyway migrate`

**Running the tests:**
```bash
npm run test              # unit tests only
npm run test:coverage     # with coverage report (must be ≥ 85%)
npm run test:integration  # requires the DB to be running
```

**DB migrations:** Migrations live in `db-${input:appName}/migrations/`. Naming: `V{major}.{minor}.{patch}__{description}.sql`. Never edit an applied migration.

**API reference:** Full OpenAPI spec at `docs/openapi.yaml`. Import into Postman via `postman/collections/${input:appName}.json`.

---

#### Step 17 — Write `repos/web-${input:appName}/DEVELOPER_GUIDE.md`

Read `repos/web-${input:appName}/src/router.tsx`, `public/static-config.json`, all files under `src/pages/` and `src/services/`, and `plans/${input:appName}/PLAN.md` before writing.

Include:

**Overview** — what this SPA does, what it communicates with, link to `web-api-${input:appName}`.

**Architecture at a glance:**
- React 18 + Vite + TypeScript + MUI v6
- Auth: Azure Entra OIDC via `framework-react-core` (MSAL under the hood)
- API calls: all in `src/services/` — never inside components
- Routing: React Router with `loader: requireAuth()` on every protected route
- List of all pages implemented (derived from `src/router.tsx`)

**Prerequisites:**
- Node.js 20+
- The `web-api-${input:appName}` API running locally

**Local development setup:**
```bash
git clone <repo-url>/web-${input:appName}
cd web-${input:appName} && npm install
# Edit public/static-config.json — see Configuration section
npm run dev   # SPA at http://localhost:3000
```

**Configuration — `public/static-config.json`** — table listing every field, what it controls, and where to find the value.

**How authentication works:**
- The MSAL flow (`framework-react-core` handles token acquisition silently)
- The `/auth/callback` route purpose
- How `requireAuth()` works as a route loader and what happens on token expiry
- How to access the current user in a component

**Adding a new page:**
1. Create `src/pages/<PageName>/<PageName>.tsx`
2. Create `src/services/<feature>Api.ts` with typed API call functions
3. Create `src/types/<feature>.types.ts`
4. Add the route to `src/router.tsx` with `loader: requireAuth()`
5. Add a nav item in `public/static-config.json`

**Running the tests:**
```bash
npm run test              # unit tests with React Testing Library
npm run test:coverage     # with coverage report (must be ≥ 85%)
```

---

#### Step 18 — Write `repos/db-${input:appName}/DEVELOPER_GUIDE.md`

Read all files in `repos/db-${input:appName}/migrations/` and `plans/${input:appName}/PLAN.md` before writing.

Include:

**Overview** — what database this repo manages, which app repos depend on it, the sibling-clone requirement.

**Architecture at a glance:**
- MSSQL (SQL Server) via Docker in local dev
- Flyway for versioned migrations
- Migration files in `migrations/` — never edit an applied migration

**Prerequisites:** Docker + Docker Compose

**Local development setup:**
```bash
git clone <repo-url>/db-${input:appName}
cd db-${input:appName}
cp flyway.conf.example flyway.conf
# Edit flyway.conf — set DB_PASSWORD and DB_DATABASE
docker compose up -d   # starts SQL Server and runs Flyway automatically
```

**Current schema** — a table summarising all tables currently defined (derived from reading the migration files):

| Table | Key columns | Purpose |
|---|---|---|
| ... | ... | ... |

**Adding a migration:**
1. Find the highest version number in `migrations/`
2. Create the next file: `V{next}__{describe-the-change}.sql`
3. Wrap DDL in `IF NOT EXISTS` / `IF EXISTS` guards
4. All new tables must include: `Id INT IDENTITY(1,1) PRIMARY KEY`, `CreatedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`, `ModifiedOn DATETIME2 NULL`
5. Data migrations must use `BEGIN TRANSACTION ... COMMIT`
6. Never use `SELECT *`
7. Apply: `docker compose run --rm flyway migrate`
8. Verify: `docker compose run --rm flyway info`

**Repeatable migrations:** Stored procedures, views, and functions use `R__<name>.sql`. These re-run whenever their checksum changes.

---

### PHASE 5 — OUTPUT SUMMARY

#### Step 19 — Final report

List:
1. Plan file created (`/plans/${input:appName}/PLAN.md`) and key architectural decisions made
2. All files created across the three repos, organized by repo
3. Any Lovable features dropped and why
4. Any Lovable features deferred to Phase 2 and what they need
5. Any assumptions made where the Lovable source was ambiguous
6. Self-audit results — any gaps found and whether they were resolved
