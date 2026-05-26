---
mode: agent
description: Scaffold a complete application from an approved plan — backend, database, frontend, and Helm chart.
tools:
  - codebase
  - editFiles
  - findFiles
  - runCommands
---

Scaffold the application **${input:appName}** from the approved plan.

---

## EMBEDDED STANDARDS REFERENCE

These rules are non-negotiable. Every file you generate must conform to them.

---

### API STRUCTURE

**Directory structure — MUST follow exactly:**
```
backend/
├── docs/
│   ├── openapi.yaml            ← OpenAPI 3.0.3 — written before implementation
│   └── ops/
│       └── runbook.md
├── postman/
│   └── collections/
│       └── <app-name>.json
├── src/
│   ├── features/               ← Code organized by BUSINESS FEATURE, never by technical layer
│   │   └── <feature>/
│   │       └── v1/             ← Each feature owns its version directories
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
└── ops/
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

### JWT / AUTH

**JWT validation — ALL claims required:**
```typescript
jwt.verify(token, publicKey, {
  algorithms: ['RS256'],                          // NEVER omit
  issuer: process.env['ENTRA_ISSUER']!,
  audience: process.env['ENTRA_AUDIENCE']!,
});
```

❌ `jwt.verify(token, secret)` — no algorithm, no issuer, no audience
❌ `jwt.decode(token)` — decode without verification

**Auth middleware pattern:**
```typescript
async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing token', requestId: request.id, timestamp: new Date().toISOString() });
  }
  try {
    const claims = jwt.verify(authHeader.slice(7), publicKey, {
      algorithms: ['RS256'],
      issuer: process.env['ENTRA_ISSUER']!,
      audience: process.env['ENTRA_AUDIENCE']!,
    });
    request.user = claims;
  } catch {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token', requestId: request.id, timestamp: new Date().toISOString() });
  }
}
```

Apply to all routes except `/health` and `/health/ready`.

---

### SECURITY

**S03 — No hardcoded secrets:**
```typescript
❌ const apiKey = 'sk_live_abc123';
✅ const apiKey = process.env['API_KEY']!;
```
Covers: API keys, DB passwords, JWT secrets, Entra clientId/secret, connection strings.
Helm values: leave all secret values as `""` with a comment — never a literal value.

**S04 — Parameterized queries only:**
```typescript
❌ db.query(`SELECT * FROM Users WHERE Id = '${userId}'`);
✅ request.input('id', sql.Int, userId).query('SELECT UserId, Email FROM dbo.Users WHERE UserId = @id');
```

**S12 — No stack traces in API responses:**
```typescript
❌ reply.send({ error: err.message, stack: err.stack });
✅ req.log.error({ err }, 'Request failed');
   reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', requestId: req.id });
```

**S15 — No wildcard CORS:**
```typescript
❌ app.register(cors, { origin: '*' });
✅ const origins = process.env['CORS_ORIGINS']!.split(',');
   app.register(cors, { origin: origins, credentials: true });
```

**S16 — Rate limiting required:**
```typescript
await app.register(rateLimit, { max: 100, timeWindow: '1 minute', keyGenerator: (req) => req.ip });
```

**S18 — Security headers required:**
```typescript
await app.register(helmet, { contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] } } });
```

**S19 — No sensitive data in logs:**
```typescript
❌ logger.info({ password: req.body.password });
❌ logger.debug({ headers: req.headers }); // contains Authorization
✅ logger.info({ userId: user.id, action: 'login' }, 'User logged in');
```

**S10 — React XSS:**
```tsx
❌ <div dangerouslySetInnerHTML={{ __html: userContent }} />
✅ <div>{userContent}</div>
// If HTML required: DOMPurify.sanitize(userContent) before rendering
```

---

### STRUCTURED LOGGING

Use Fastify's built-in logger (`fastify.log` / `req.log`) — never `console.log`.

Required fields on every log entry:
- `timestamp`, `level`, `message`, `requestId`, `traceId`, `spanId`
- `method`, `path`, `statusCode`, `latencyMs`
- `clientIp` (mask last octet: `192.168.1.xxx`), `service`, `version`, `environment`

---

### CODE QUALITY

**No TypeScript `any`:**
```typescript
❌ function process(data: any): any { ... }
✅ function process(data: unknown): ProcessedResult {
     const validated = DataSchema.parse(data); // Zod narrow
     return transform(validated);
   }
```

**async/await only — no `.then()` chains:**
```typescript
❌ fetchUser(id).then(user => process(user)).then(save).catch(handleError);
✅ try { const user = await fetchUser(id); const result = await process(user); await save(result); } catch (err) { handleError(err); }
```

**`const` for all immutable variables. Strict equality (`===`). Early returns over deep nesting.**

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
- Timers/subscriptions must return a cleanup function

---

### DB MIGRATIONS (FLYWAY)

**Naming — MANDATORY:**
```
V{major}.{minor}.{patch}__{description}.sql   ← versioned, runs once
R__{description}.sql                           ← repeatable (views, procs, functions)

✅ V1.0.0__create_schema.sql
✅ R__vw_user_summary.sql
❌ V1_initial_schema.sql   ← single underscore
❌ v1__schema.sql          ← lowercase v
```

**NEVER edit an applied migration.** Create a new file to fix bugs.

**SQL type standards:**
```sql
Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id)
CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
ModifiedOn DATETIME2 NULL
Name       NVARCHAR(200) NOT NULL   -- NVARCHAR for all strings
Enabled    BIT NOT NULL DEFAULT 1   -- BIT for booleans (use 1/0, not true/false)
```

**Never `SELECT *` in migrations.**

**Data migrations must use transactions with verification:**
```sql
BEGIN TRANSACTION;
  UPDATE dbo.Users SET Status = 'active' WHERE Status IS NULL;
  IF EXISTS (SELECT 1 FROM dbo.Users WHERE Status IS NULL)
  BEGIN
    ROLLBACK;
    THROW 50001, 'Backfill failed: NULL Status values remain', 1;
  END
COMMIT;
```

**Never leave a transaction open** — always COMMIT or ROLLBACK.

**Use IF NOT EXISTS guards for additive DDL.**

**Stored procedures and views → repeatable migrations:**
```sql
-- R__usp_get_user_documents.sql
CREATE OR ALTER PROCEDURE dbo.usp_GetUserDocuments @UserId INT AS ...
```

**Never commit `flyway.conf` with real credentials** — only `flyway.conf.example`.

**DB lives at `/repos/${input:appName}/db/` — NOT inside `backend/`.**

---

### OPENAPI SPEC

Every endpoint in `docs/openapi.yaml` must have:
- `summary` + `description`
- `security` with required scopes
- All parameters with `schema`, constraints, and `example`
- Response schemas for ALL status codes
- At least one happy-path example and one error example

---

### FRONTEND

**Service layer — never call API from components:**
```typescript
// src/services/userApi.ts
export const userApi = {
  async getUsers(): Promise<User[]> {
    const { data } = await axios.get<User[]>('/api/v1/Users');
    return data;
  }
};
```

**MUI for all UI** — no raw HTML for layout (use `Box`, `Stack`, `Grid`, `Paper`).

**Router protection:**
```typescript
{ path: '/dashboard', element: <Dashboard />, loader: requireAuth() }  // protected
{ path: '/auth/callback', element: <AuthCallback /> }                    // public
```

---

## WORKFLOW

### Step 1 — Read the plan

Read all files in `/plans/${input:appName}/`. Note every API endpoint, DB table, frontend page, and Helm config change before creating any files.

### Step 2 — Create the output directory

Create `/repos/${input:appName}/` if it does not exist.

### Step 3 — Scaffold the backend

**IMPORTANT: Always start from the template. Never create backend files from scratch.**

3a. Copy the entire contents of `/templates/framework-nodejs-starter-kit/` into `/repos/${input:appName}/backend/`.

3b. Customize copied files:
- `package.json`: set `name` to `${input:appName}-backend`, set `description`
- `src/static-config.json`: set `FRAMEWORK_HTTP_PORT` to `8080`
- `README.md`: replace TODO content with app name, local dev steps, link to `docs/openapi.yaml`
- `azure-pipelines.yml`: replace all occurrences of `templateweb` with `${input:appName}` — this updates variable group names, environment names, and repository references throughout the pipeline
- Create `backend/.env.example`: one entry per environment variable from the plan's Environment Variables table. Use realistic but non-functional placeholder values with an inline comment for each. Group by category (Database, Auth, CORS, then any app-specific vars). Required entries:

```bash
# Database — SQL Server connection
DB_SERVER=localhost
DB_DATABASE=AppNameDb
DB_USER=sa
DB_PASSWORD=Change_Me_123!
DB_PORT=1433

# Azure Entra — JWT validation
ENTRA_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0
ENTRA_AUDIENCE=<client-id>

# CORS — comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000
# (add any app-specific variables from the plan below this line)
```

3c. Create `docs/openapi.yaml` — **write this BEFORE any route code** (contract-first). Every endpoint from the plan must appear here. Use this structure:

```yaml
openapi: 3.0.3
info:
  title: <App Name> API
  version: 1.0.0
  description: <one-sentence description from the plan>
servers:
  - url: http://localhost:8080
    description: Local development
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
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
    # One schema per entity from the plan — include all fields with types, formats, and required[]
paths:
  /health:
    get:
      summary: Liveness probe
      operationId: getHealth
      tags: [Health]
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: HEALTHY }
                  timestamp: { type: string, format: date-time }
                  checks: { type: object, additionalProperties: { type: string } }
  # One path block per endpoint from the plan
```

Requirements for every non-health path entry:
- `operationId`: unique camelCase verb+noun (`listUsers`, `createUser`, `getUserById`)
- `tags`: feature module name
- `security: [{ bearerAuth: [] }]` on every protected route
- `parameters`: every path/query param with `schema`, `required`, and `example`
- `requestBody` (POST/PUT/PATCH): `required: true`; inline schema with all fields, types, `required[]`, and validation constraints (`minLength`, `pattern`, `enum`, etc.)
- `responses`: ALL expected status codes (200/201/204 + applicable 4xx + 500)
  - Every response entry: `description` + `content` with inline or `$ref` schema
  - 201 responses include `headers: { Location: { schema: { type: string } } }`
  - All error responses use `$ref: '#/components/schemas/Error'`

3d. Create `src/shared/auth/auth.middleware.ts` — validates Bearer JWT with RS256, issuer, audience all from env.

3e. Create `src/shared/db/db.client.ts` — mssql ConnectionPool created once at startup; typed `executeQuery(sql, params)` helper; parameterized queries only; config from env.

3f. Create `src/shared/errors/error.handler.ts` — centralized Fastify error handler (see pattern above).

3g. Register on app startup: `@fastify/helmet`, `@fastify/rate-limit` (100/min), `@fastify/cors` (env origins only).

3h. Create feature-based source structure. Implement the `docs/openapi.yaml` contract exactly — every route, request shape, and response shape must match the spec. For each feature from the plan:
- `<feature>.routes.ts` — Fastify plugin registering all endpoints; applies auth middleware
- `<feature>.service.ts` — business logic; no framework dependencies; typed inputs/outputs; no `any`
- `<feature>.schema.ts` — Zod schemas that match the openapi.yaml request/response schemas exactly
- `<feature>.types.ts` — TypeScript interfaces matching DB entities

3i. Create `docs/ops/runbook.md` — local dev setup, env var reference table, troubleshooting.

3j. Create Postman artifacts:
- `postman/collections/${input:appName}.json` — Postman collection v2.1; one request per endpoint; `pm.test(...)` scripts verifying status code and response shape; all requests use `{{baseUrl}}` and `Authorization: Bearer {{bearerToken}}`
- `postman/environments/${input:appName}-local.postman_environment.json`:

```json
{
  "name": "${input:appName} — Local",
  "values": [
    { "key": "baseUrl",     "value": "http://localhost:8080", "type": "default", "enabled": true },
    { "key": "bearerToken", "value": "",                      "type": "secret",  "enabled": true }
  ],
  "_postman_variable_scope": "environment"
}
```

3k. Add health check routes (`GET /health`, `GET /health/ready`) — no auth on these.

3l. Create backend test stubs. For each feature, create `tests/unit/<feature>.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { <Feature>Service } from '../../src/features/<feature>/v1/<feature>.service';

const mockDb = { executeQuery: vi.fn() };

describe('<Feature>Service', () => {
  let service: <Feature>Service;
  beforeEach(() => { vi.clearAllMocks(); service = new <Feature>Service(mockDb as any); });

  it('is instantiated correctly', () => { expect(service).toBeDefined(); });
  // TODO: one describe block per public method; stub responses with mockDb.executeQuery.mockResolvedValue(...)
});
```

### Step 4 — Scaffold the database

**DB lives at `/repos/${input:appName}/db/` — NOT inside `backend/`.**

```
db/
├── migrations/
│   ├── V1.0.0__create_schema.sql      ← IF NOT EXISTS schema creation
│   └── V1.0.1__create_<tables>.sql    ← one file per table or logical group
├── seeds/
│   └── seed_reference_data.sql        ← if applicable
├── flyway.conf.example                ← placeholder values only
└── README.md                          ← local DB workflow
```

### Step 5 — Generate root docker-compose.yml

Create `/repos/${input:appName}/docker-compose.yml` at the repo root. This file wires together SQL Server, the db-init helper, Flyway, the backend, and the frontend for local development.

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
      - ./db/migrations:/flyway/sql
    environment:
      FLYWAY_URL: "jdbc:sqlserver://db:1433;databaseName=${DB_DATABASE};encrypt=true;trustServerCertificate=true"
      FLYWAY_USER: "${DB_USER}"
      FLYWAY_PASSWORD: "${DB_PASSWORD}"
      FLYWAY_LOCATIONS: "filesystem:/flyway/sql"
      FLYWAY_BASELINE_ON_MIGRATE: "true"

  backend:
    build:
      context: ./backend
      target: development
      args:
        NPM_TOKEN: "${NPM_TOKEN:-}"
    ports:
      - "8080:8080"
      - "9229:9229"
    volumes:
      - ./backend/src:/opt/cla/src
    env_file: ./backend/.env
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      target: base
      args:
        NPM_TOKEN: "${NPM_TOKEN:-}"
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/opt/cla/src
      - ./frontend/public:/opt/cla/public
    environment:
      NODE_ENV: development
```

Also add the following commands to `backend/docs/ops/runbook.md` under a "Local Development" section:

```bash
# Start SQL Server only
docker compose --env-file backend/.env up -d db

# Create the app database (run once after first `up -d db`)
docker compose --env-file backend/.env run --rm db-init

# Run Flyway migrations
docker compose --env-file backend/.env run --rm flyway

# Start all services (use for integration testing or full local dev)
docker compose --env-file backend/.env up
```

### Step 6 — Scaffold the frontend

**IMPORTANT: Always start from the template. Never create frontend files from scratch.**

6a. Copy the entire contents of `/templates/framework-react-starter-kit/` into `/repos/${input:appName}/frontend/`.

6b. Customize:
- `package.json`: set `name` to `${input:appName}-frontend`
- `azure-pipelines.yml`: replace all occurrences of `templateweb` with `${input:appName}`
- `public/static-config.json`:
  - `FRAMEWORK_UI_NAME`: app display name
  - `FRAMEWORK_UI_AUTH_ENTRA.clientId`: `""` — set at deploy
  - `FRAMEWORK_UI_AUTH_ENTRA.authority`: `""` — set at deploy
  - `FRAMEWORK_UI_AUTH_ENTRA.redirectUri`: `"http://localhost:3000/auth/callback"`
  - `FRAMEWORK_UI_NAVBAR`: nav items from the plan
  - `FRAMEWORK_UI_AUTH_SCOPES`: required API scopes from the plan
- `index.html`: set `<title>` to app display name

6c. Create source structure per the plan:
```
src/
├── pages/<PageName>/<PageName>.tsx    ← one file per page
├── components/                        ← shared UI components
├── services/<feature>Api.ts           ← API calls (never in components)
├── types/<feature>.types.ts           ← TypeScript interfaces
└── router.tsx                         ← routes from the plan
```

Every page: MUI components, service calls only, loading + error states, TypeScript types, protected via `loader: requireAuth()` unless explicitly public.

6d. Create frontend test stubs. For each page, create `test/unit/<PageName>.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import <PageName> from '../../src/pages/<PageName>/<PageName>';

vi.mock('../../src/services/<feature>Api', () => ({ <feature>Api: {} }));

describe('<PageName>', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><PageName /></MemoryRouter>);
    expect(document.body).toBeDefined();
    // TODO: add assertions for key elements
  });
});
```

### Step 7 — Scaffold the Helm chart

**IMPORTANT: Always start from the template. Never create Helm files from scratch.**

7a. Copy the entire contents of `/helm/` into `/repos/${input:appName}/helm/`.

7b. Apply the Helm configuration changes from the plan:
- `Chart.yaml`: `name`, `description`
- `values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix`, `serviceAccount.name`
- All values files: env-specific `istio.hosts`; leave `azureWorkloadIdentityClientId` as empty placeholder

### Step 8 — Generate .github/copilot-instructions.md

Create `/repos/${input:appName}/.github/copilot-instructions.md`. This file travels with the generated app into its own repository and gives Copilot complete context for all future feature development — without access to the spec kit.

**Part 1 — App-specific header (fill in from the plan):**

```markdown
# <App Display Name> — Copilot Instructions

<One-sentence description of what this application does.>

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20 + Fastify + TypeScript |
| Frontend | React 18 + Vite + TypeScript + MUI v6 |
| Database | MSSQL (SQL Server) + Flyway migrations |
| Auth | Azure Entra — OIDC for SPA, JWT bearer for API |
| Local dev | Docker + Docker Compose |
| Deployment | AKS + Helm |

## This App's Structure

**Backend features** (`backend/src/features/<feature>/v1/`):
<list each feature from the plan with a one-line description of what it owns>

**Frontend pages**:
<list each page from the plan with its route and purpose>

**Database tables** (`db/migrations/`):
<list each table from the plan with a one-line description>

## Key Files
- `backend/docs/openapi.yaml` — API contract; update this before adding new routes (contract-first)
- `db/migrations/` — Flyway SQL migrations; never edit an applied file, always create a new one
- `backend/.env.example` → `backend/.env` — environment variable reference for local setup
- `docker-compose.yml` — local services: SQL Server + Flyway + backend + frontend
- `backend/postman/collections/${input:appName}.json` — API test collection with test scripts
```

**Part 2 — Coding standards:**

Use the `codebase` tool to read `/.github/copilot-instructions.md` (the spec kit's instructions file). Starting from the `## API Standards` heading, copy every section through the end of that file — all rules, ❌/✅ examples, and code snippets — verbatim into the generated file. Do NOT copy the spec-kit-specific content before `## API Standards`.

### Step 9 — Create root README

Create `/repos/${input:appName}/README.md`:
```markdown
# <App Name>

<One-line description>

## Repository structure
- `backend/` — Node.js + Fastify API (TypeScript)
- `db/` — Flyway SQL migrations (MSSQL)
- `frontend/` — React + Vite SPA (TypeScript + MUI)
- `helm/` — Kubernetes deployment (Helm + AKS)

## Local development
See [backend/README.md](backend/README.md), [db/README.md](db/README.md), and [frontend/README.md](frontend/README.md). Use `docker-compose.yml` at the repo root to start SQL Server and run Flyway migrations (see `backend/docs/ops/runbook.md` for commands).
```

### Step 10 — Self-audit

Verify before reporting complete:

1. No hardcoded secrets (Entra clientId/secret, DB passwords, JWT secrets as literal values)
2. Every API endpoint in the plan has a route file, service stub, and openapi.yaml entry — with all required status codes, parameter schemas, and request body schemas
3. Every DB table in the plan has a Flyway migration in `db/migrations/`
4. Every frontend page in the plan has a `.tsx` file
5. No `any` types in any TypeScript file
6. No `console.log` in any production code file
7. All SQL uses parameterized queries — no string concatenation
8. `@fastify/helmet` and `@fastify/rate-limit` registered in `app.ts`
9. JWT middleware validates `algorithms`, `issuer`, `audience`
10. CORS configured with env var origins (no wildcards)
11. Helm values have no leftover placeholder strings except those marked "set at deploy time"
12. `db/flyway.conf` is NOT present — only `db/flyway.conf.example`
13. `docker-compose.yml` exists at the repo root with `db`, `db-init`, `flyway`, `backend`, and `frontend` services
14. `backend/.env.example` exists and contains every environment variable listed in the plan
15. `.github/copilot-instructions.md` exists with the app-specific structure section and the full embedded standards
16. `postman/environments/${input:appName}-local.postman_environment.json` exists alongside the collection
17. `backend/azure-pipelines.yml` and `frontend/azure-pipelines.yml` have no remaining `templateweb` references
18. Every backend feature has a test stub in `backend/tests/unit/` and every frontend page has one in `frontend/test/unit/`

Report any gaps found.

### Step 11 — Output summary

List all files created, organized by directory. Note any items from the plan not fully implemented and explain why.
