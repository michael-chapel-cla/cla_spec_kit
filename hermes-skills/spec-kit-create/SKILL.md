---
name: spec-kit-create
description: Run /create <app-name> — scaffold three repos from PLAN.md (API, frontend, database)
category: software-development
---

Scaffold the application **${input:appName}** from the approved plan.

Each application is split into three independent repositories:
- `web-api-${input:appName}` — Fastify API (backend)
- `web-${input:appName}` — React SPA (frontend)
- `db-${input:appName}` — Flyway database migrations

These repos are designed to be cloned as siblings in the same parent directory so docker-compose volume paths resolve correctly.

---

## EMBEDDED STANDARDS REFERENCE

These rules are non-negotiable. Every file you generate must conform to them.

---

### API STRUCTURE

**API repo root structure — MUST follow exactly:**
```
web-api-<app-name>/
├── docs/
│   ├── openapi.yaml            ← OpenAPI 3.0.3 — written before implementation
│   ├── ops/
│   │   └── runbook.md
│   └── spec/                   ← requirements + plan copied from spec-kit
│       ├── requirements/       ← all 16 files from requirements/<app-name>/
│       └── PLAN.md             ← copy of plans/<app-name>/PLAN.md
├── postman/
│   ├── collections/
│   │   └── <app-name>.json
│   └── environments/
│       └── <app-name>-local.postman_environment.json
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

**S12 — No stack traces in API responses.**

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

---

## WORKFLOW

### Step 1 — Read the plan

Read all files in `/plans/${input:appName}/`. Note every API endpoint, DB table, frontend page, and Helm config change before creating any files.

### Step 2 — Create the three output directories

Create these three sibling directories under `/repos/`:
- `/repos/web-api-${input:appName}/`
- `/repos/web-${input:appName}/`
- `/repos/db-${input:appName}/`

---

### Step 3 — Scaffold the API repo (`web-api-${input:appName}`)

**IMPORTANT: Always start from the template. Never create API files from scratch.**

**3a.** Copy the entire contents of `/templates/framework-nodejs-starter-kit/` into `/repos/web-api-${input:appName}/`.

**3b.** Customize copied files:
- `package.json`: set `name` to `web-api-${input:appName}`, set `description`
- `src/static-config.json`: set `FRAMEWORK_HTTP_PORT` to `8080`
- `README.md`: replace TODO content with app name, local dev steps, link to `docs/openapi.yaml`
- `.github/workflows/ci.yml`: replace all occurrences of `templateweb` with `web-api-${input:appName}`
- Create `.env.example` with one entry per environment variable from the plan. Use realistic but non-functional placeholder values with an inline comment for each. Group by category:

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

**3c.** Create `docs/openapi.yaml` — **write this BEFORE any route code** (contract-first). Every endpoint from the plan must appear here. Use this structure:

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
  # One path block per endpoint from the plan
```

Every non-health path: `operationId`, `tags`, `security: [{ bearerAuth: [] }]`, full `parameters`, `requestBody` (POST/PUT/PATCH), and responses for ALL expected status codes. 201 responses include a `Location` header. All error responses use `$ref: '#/components/schemas/Error'`.

**3d.** Create `src/shared/auth/auth.middleware.ts` — validates Bearer JWT with RS256, issuer, audience all from env.

**3e.** Create `src/shared/db/db.client.ts` — mssql ConnectionPool created once at startup; typed `executeQuery(sql, params)` helper; parameterized queries only; config from env.

**3f.** Create `src/shared/errors/error.handler.ts` — centralized Fastify error handler.

**3g.** Register on app startup: `@fastify/helmet`, `@fastify/rate-limit` (100/min), `@fastify/cors` (env origins only).

**3h.** Create feature-based source structure. Implement the `docs/openapi.yaml` contract exactly. For each feature from the plan:
- `<feature>.routes.ts` — Fastify plugin; applies auth middleware
- `<feature>.service.ts` — business logic; no framework dependencies; typed inputs/outputs; no `any`
- `<feature>.schema.ts` — Zod schemas matching openapi.yaml exactly
- `<feature>.types.ts` — TypeScript interfaces matching DB entities

**3i.** Create `docs/ops/runbook.md` — local dev setup, env var reference table, troubleshooting, and the following commands:

```bash
# Ensure db-${input:appName} is cloned as a sibling of this repo
# Clone: git clone <db-repo-url> ../db-${input:appName}

# Copy and edit the env file
cp .env.example .env

# Start SQL Server
docker compose up -d db

# Create the app database (run once after first `up -d db`)
docker compose run --rm db-init

# Run Flyway migrations (reads ../db-${input:appName}/migrations)
docker compose run --rm flyway

# Start all services
docker compose up

# Run migrations only (validate existing)
docker compose run --rm flyway validate
```

**3j.** Create Postman artifacts:
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

**3k.** Add health check routes (`GET /health`, `GET /health/ready`) — no auth.

**3l.** Create backend test stubs. For each feature, create `tests/unit/<feature>.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { <Feature>Service } from '../../src/features/<feature>/v1/<feature>.service';

const mockDb = { executeQuery: vi.fn() };

describe('<Feature>Service', () => {
  let service: <Feature>Service;
  beforeEach(() => { vi.clearAllMocks(); service = new <Feature>Service(mockDb as any); });

  it('is instantiated correctly', () => { expect(service).toBeDefined(); });
  // TODO: one describe block per public method
});
```

**3m.** Create `docker-compose.yml` at the API repo root. This wires together SQL Server, db-init, Flyway (reading migrations from the sibling db repo), and the backend:

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

**3n.** Create `.devcontainer/devcontainer.json`:

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

**3o.** Copy the Helm chart. Copy the entire contents of `/templates/helm/` into `/repos/web-api-${input:appName}/helm/`. Apply the API-specific Helm config from the plan:
- `helm/Chart.yaml`: `name` → `web-api-${input:appName}`, `description`
- `helm/values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix` → `/api`, `serviceAccount.name`
- All `values-*.yaml`: env-specific `istio.hosts`; `azureWorkloadIdentityClientId` as empty placeholder

---

### Step 4 — Scaffold the DB repo (`db-${input:appName}`)

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

Create Flyway migration files per the plan's DB schema. Every table must include:
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

### Step 5 — Scaffold the frontend repo (`web-${input:appName}`)

**IMPORTANT: Always start from the template. Never create frontend files from scratch.**

**5a.** Copy the entire contents of `/templates/framework-react-starter-kit/` into `/repos/web-${input:appName}/`.

**5b.** Customize copied files:
- `package.json`: set `name` to `web-${input:appName}`
- `.github/workflows/ci.yml`: replace all occurrences of `templateweb` with `web-${input:appName}`
- `public/static-config.json`:
  - `FRAMEWORK_UI_NAME`: app display name
  - `FRAMEWORK_UI_AUTH_ENTRA.clientId`: `""` — set at deploy
  - `FRAMEWORK_UI_AUTH_ENTRA.authority`: `""` — set at deploy
  - `FRAMEWORK_UI_AUTH_ENTRA.redirectUri`: `"http://localhost:3000/auth/callback"`
  - `FRAMEWORK_UI_NAVBAR`: nav items from the plan
  - `FRAMEWORK_UI_AUTH_SCOPES`: required API scopes from the plan
- `index.html`: set `<title>` to app display name

**5c.** Create source structure per the plan:
```
src/
├── pages/<PageName>/<PageName>.tsx    ← one file per page
├── components/                         ← shared UI components
├── services/<feature>Api.ts            ← API calls (never in components)
├── types/<feature>.types.ts            ← TypeScript interfaces
└── router.tsx                          ← routes from the plan
```

Every page: MUI components, service calls only, loading + error states, TypeScript types, protected via `loader: requireAuth()` unless explicitly public.

**5d.** Create frontend test stubs. For each page, create `test/unit/<PageName>.test.tsx`:

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

**5e.** Create `docker-compose.yml` at the frontend repo root:

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

**5f.** Create `.devcontainer/devcontainer.json`:

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

**5g.** Copy the Helm chart. Copy the entire contents of `/templates/helm/` into `/repos/web-${input:appName}/helm/`. Apply the frontend-specific Helm config from the plan:
- `helm/Chart.yaml`: `name` → `web-${input:appName}`, `description`
- `helm/values.yaml`: `app.name`, `image.repository`, `istio.pathPrefix` → `/`, `serviceAccount.name`
- All `values-*.yaml`: env-specific `istio.hosts`; `azureWorkloadIdentityClientId` as empty placeholder

---

### Step 6 — Generate `.github/copilot-instructions.md` for each repo

Each repo gets its own copilot-instructions tailored to its concern.

**6a. API repo** — Create `/repos/web-api-${input:appName}/.github/copilot-instructions.md`:

Part 1 — App-specific header:
```markdown
# <App Display Name> API — Copilot Instructions

<One-sentence description of what this API does.>

## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + Fastify + TypeScript |
| Database | MSSQL (SQL Server) + Flyway migrations |
| Auth | Azure Entra — RS256 JWT bearer |
| Local dev | Docker Compose |
| Deployment | AKS + Helm |

## Features (`src/features/<feature>/v1/`)
<list each feature with a one-line description>

## Database Tables
<list each table from the plan with a one-line description>

## Key Files
- `docs/openapi.yaml` — API contract; update this BEFORE adding routes (contract-first)
- `.env.example` → `.env` — environment variable reference for local setup
- `docker-compose.yml` — local: SQL Server + Flyway + backend (Flyway reads ../db-${input:appName}/migrations)
- `postman/collections/${input:appName}.json` — API test collection
- `helm/` — Kubernetes deployment chart
```

Part 2 — Read the spec kit's `.github/copilot-instructions.md` (this file). Copy every section from `## API Standards` through the end of the file verbatim. Do NOT copy spec-kit-specific content before that heading.

**6b. Frontend repo** — Create `/repos/web-${input:appName}/.github/copilot-instructions.md`:

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

**6c. DB repo** — Create `/repos/db-${input:appName}/.github/copilot-instructions.md`:

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

### Step 7 — Create READMEs for each repo

**7a.** `/repos/web-api-${input:appName}/README.md`:
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

**Requires `db-${input:appName}` cloned as a sibling directory** — docker-compose mounts migrations from `../db-${input:appName}/migrations`.

```bash
cp .env.example .env
# edit .env
docker compose up
```
```

**7b.** `/repos/web-${input:appName}/README.md`:
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

```bash
docker compose up
```
```

**7c.** `/repos/db-${input:appName}/README.md`:
```markdown
# <App Name> DB

Flyway migration scripts for <App Name>. Consumed by `web-api-${input:appName}` via docker-compose.

## Structure
- `migrations/` — versioned SQL migrations (`V{major}.{minor}.{patch}__{description}.sql`)
- `seeds/` — reference data scripts (run manually, not via Flyway)
- `flyway.conf.example` — copy to `flyway.conf` and fill in credentials for local use

## Local development (standalone)
```bash
cp flyway.conf.example flyway.conf
# edit flyway.conf
docker compose up
```

## Adding a migration
Create a new file in `migrations/` — never edit an existing applied file.
```
```

---

### Step 8 — Copy requirements and plan into each repo

Copy the spec context into all three repos so developers have full background without needing access to the spec-kit:

**API repo** — copy into `web-api-${input:appName}/docs/spec/`:
- All files from `requirements/${input:appName}/` → `docs/spec/requirements/`
- `plans/${input:appName}/PLAN.md` → `docs/spec/PLAN.md`

**Frontend repo** — copy into `web-${input:appName}/docs/spec/`:
- All files from `requirements/${input:appName}/` → `docs/spec/requirements/`
- `plans/${input:appName}/PLAN.md` → `docs/spec/PLAN.md`

**DB repo** — copy into `db-${input:appName}/docs/spec/`:
- All files from `requirements/${input:appName}/` → `docs/spec/requirements/`
- `plans/${input:appName}/PLAN.md` → `docs/spec/PLAN.md`

---

### Step 9 — Self-audit

Verify before reporting complete:

1. No hardcoded secrets in any repo (Entra clientId/secret, DB passwords, JWT secrets as literal values)
2. Every API endpoint in the plan has a route file, service stub, and `docs/openapi.yaml` entry — with all required status codes, parameter schemas, and request body schemas
3. Every DB table in the plan has a Flyway migration in `db-${input:appName}/migrations/`
4. Every frontend page in the plan has a `.tsx` file
5. No `any` types in any TypeScript file
6. No `console.log` in any production code file
7. All SQL uses parameterized queries — no string concatenation
8. `@fastify/helmet` and `@fastify/rate-limit` registered in `app.ts`
9. JWT middleware validates `algorithms`, `issuer`, `audience`
10. CORS configured with env var origins (no wildcards)
11. Helm values have no leftover placeholder strings except those marked "set at deploy time" — applies to BOTH `web-api-${input:appName}/helm/` and `web-${input:appName}/helm/`
12. `flyway.conf` is NOT present in `db-${input:appName}/` — only `flyway.conf.example`
13. `web-api-${input:appName}/docker-compose.yml` mounts `../db-${input:appName}/migrations` for Flyway
14. `db-${input:appName}/docker-compose.yml` mounts `./migrations` (standalone, self-contained)
15. `web-${input:appName}/docker-compose.yml` contains only the frontend service
16. `.env.example` exists in `web-api-${input:appName}/` and contains every environment variable in the plan
17. `.github/workflows/ci.yml` in both `web-api-${input:appName}/` and `web-${input:appName}/` has no remaining `templateweb` references
18. `.github/copilot-instructions.md` exists in all three repos with app-specific structure sections
19. `.devcontainer/devcontainer.json` exists in all three repos
20. `postman/environments/${input:appName}-local.postman_environment.json` exists in `web-api-${input:appName}/`
21. Every backend feature has a test stub in `web-api-${input:appName}/tests/unit/`
22. Every frontend page has a test stub in `web-${input:appName}/test/unit/`
23. `docs/spec/requirements/` and `docs/spec/PLAN.md` exist in all three repos

Report any gaps found.

### Step 10 — Generate developer guides

Read `.github/prompts/docs.prompt.md` and execute every step it describes for `${input:appName}`.

This generates `DEVELOPER_GUIDE.md` in each of the three repos — the guides describe local setup, auth, how to add features, and migration conventions, all specific to this app.

---

### Step 11 — Output summary

List all files created, organized by repo. Note any items from the plan not fully implemented and explain why.
