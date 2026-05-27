---
name: spec-kit-create
description: Run /create <app-name> — scaffold full app from PLAN.md (backend, db, frontend, helm)
category: software-development
---

# Spec Kit — /create Command

Run this when the user says "create <app-name>" or "/create <app-name>".

## EMBEDDED STANDARDS (Non-Negotiable)

### API Structure
- Directory: `backend/src/features/<feature>/v1/` (routes, service, schema, types) — NEVER `controllers/`, `services/`, `repositories/`
- URI versioning: `/api/v1/ResourceName` (PascalCase plural, no verbs)
- HTTP contracts: GET→200, POST→201+Location, PUT→200/204, PATCH→200, DELETE→204
- Error format: `{error, message, details[], timestamp, requestId}` — never generic 400
- Health endpoints: `GET /health`, `GET /health/ready` (unprotected)
- JSON: camelCase properties, ISO 8601 dates, omit optional fields (never null)

### Security
- S03: No hardcoded secrets — use `process.env['VAR']!`
- S04: Parameterized queries only (no string concatenation)
- S12: No stack traces in responses
- S15: No wildcard CORS (`*`) — explicit origins from env
- S16: Rate limiting `@fastify/rate-limit` (100/min)
- S18: Security headers `@fastify/helmet` (CSP, X-Frame-Options, etc.)
- S19: No sensitive data in logs (passwords, tokens, Authorization headers)

### Code Quality
- No TypeScript `any` — use `unknown` + Zod
- async/await only (no `.then()` chains)
- `const` for immutable, strict equality (`===`)
- No `console.log` — use Fastify logger

### DB Migrations (Flyway)
- Naming: `V{major}.{minor}.{patch}__{description}.sql` (double underscore, uppercase V)
- Every table: `Id INT IDENTITY(1,1)` PK, `CreatedOn DATETIME2 DEFAULT SYSUTCDATETIME()`, `ModifiedOn DATETIME2 NULL`
- Strings: `NVARCHAR`, booleans: `BIT` (1/0), timestamps: `DATETIME2`
- Stored procedures/views: `R__{name}.sql` repeatable migrations
- Data migrations: use transactions with verification (BEGIN/COMMIT)
- Never edit applied migration — create new versioned file
- `flyway.conf` NOT committed (only `.example`)

### Frontend
- API calls in `src/services/<feature>Api.ts` only — never in components
- All pages use MUI components (Box, Stack, Grid, Paper)
- Protected routes: `loader: requireAuth()` from framework-react-core
- Auth config in `public/static-config.json` (clientId/authority — never hardcoded)

## WORKFLOW

### Step 1 — Read the plan
Read all files in `/plans/<app-name>/`. Note every API endpoint, DB table, frontend page, Helm config change.

### Step 2 — Create output directory
Create `/repos/<app-name>/` if it doesn't exist.

### Step 3 — Scaffold backend
**IMPORTANT: Always start from template. Never create backend files from scratch.**

3a. Copy `/templates/framework-nodejs-starter-kit/` → `/repos/<app-name>/backend/`

3b. Customize:
- `package.json`: name → `<app-name>-backend`, set description
- `src/static-config.json`: `FRAMEWORK_HTTP_PORT` → `8080`
- `README.md`: app name, local dev steps, link to `docs/openapi.yaml`
- `azure-pipelines.yml`: replace all `templateweb` with `<app-name>` (updates variable groups, env names, repo refs)
- Create `backend/.env.example`: one entry per env var from plan's Environment Variables table. Realistic but non-functional placeholders with inline comments. Group by category (Database, Auth, CORS, app-specific). Required:
```bash
# Database — SQL Server connection
DB_SERVER=localhost
DB_DATABASE=AppNameDb
DB_USER=sa
DB_PASSWORD=Change...n
# Azure Entra — JWT validation
ENTRA_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0
ENTRA_AUDIENCE=<client-id>

# CORS — comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000
```

3c. Create `docs/openapi.yaml` — **WRITE THIS BEFORE route code** (contract-first). Every endpoint from plan must appear. Structure:
```yaml
openapi: 3.0.3
info:
  title: <App Name> API
  version: 1.0.0
  description: <one-sentence from plan>
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
          items: { type: object, properties: { field: { type: string }, message: { type: string } } }
    # One schema per entity from plan — all fields with types, formats, required[]
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
  # One path block per endpoint from plan
```

Requirements for every non-health path:
- `operationId`: unique camelCase verb+noun (`listUsers`, `createUser`)
- `tags`: feature module name
- `security: [{ bearerAuth: [] }]` on protected routes
- `parameters`: every param with `schema`, `required`, `example`
- `requestBody` (POST/PUT/PATCH): `required: true`; inline schema with all fields, types, `required[]`, validation constraints (`minLength`, `pattern`, `enum`)
- `responses`: ALL expected status codes (200/201/204 + applicable 4xx + 500)
  - Every response: `description` + `content` with inline or `$ref` schema
  - 201 responses: `headers: { Location: { schema: { type: string } } }`
  - Error responses: `$ref: '#/components/schemas/Error'`

3d. Create `src/shared/auth/auth.middleware.ts` — validates Bearer JWT with RS256, issuer, audience from env.

3e. Create `src/shared/db/db.client.ts` — mssql ConnectionPool created once at startup; typed `executeQuery(sql, params)` helper; parameterized queries only.

3f. Create `src/shared/errors/error.handler.ts` — centralized Fastify error handler:
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

3g. Register on app startup: `@fastify/helmet`, `@fastify/rate-limit` (100/min), `@fastify/cors` (env origins only).

3h. Create feature-based source structure. Implement `docs/openapi.yaml` contract exactly — every route, request shape, response shape must match spec. For each feature from plan:
- `<feature>.routes.ts` — Fastify plugin registering all endpoints; applies auth middleware
- `<feature>.service.ts` — business logic; no framework deps; typed inputs/outputs; no `any`
- `<feature>.schema.ts` — Zod schemas matching openapi.yaml request/response schemas exactly
- `<feature>.types.ts` — TypeScript interfaces matching DB entities

3i. Create `docs/ops/runbook.md` — local dev setup, env var reference table, troubleshooting.

3j. Create Postman artifacts:
- `postman/collections/<app-name>.json` — Postman collection v2.1; one request per endpoint; `pm.test(...)` scripts verifying status code and response shape; all requests use `{{baseUrl}}` and `Authorization: Bearer *** `postman/environments/<app-name>-local.postman_environment.json`:
```json
{
  "name": "<app-name> — Local",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:8080", "type": "default", "enabled": true },
    { "key": "bearerToken", "value": "", "type": "secret", "enabled": true }
  ],
  "_postman_variable_scope": "environment"
}
```

3k. Add health check routes (`GET /health`, `GET /health/ready`) — no auth.

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

### Step 4 — Scaffold frontend
**IMPORTANT: Always start from template. Never create frontend files from scratch.**

4a. Copy `/templates/framework-react-starter-kit/` → `/repos/<app-name>/frontend/`

4b. Customize:
- `package.json`: name → `<app-name>-frontend`
- `.github/workflows/ci.yml`: replace all `templateweb` with `<app-name>`
- `public/static-config.json`:
  - `FRAMEWORK_UI_NAME`: app display name
  - `FRAMEWORK_UI_AUTH_ENTRA.clientId`: `""` — set at deploy
  - `FRAMEWORK_UI_AUTH_ENTRA.authority`: `""` — set at deploy
  - `FRAMEWORK_UI_AUTH_ENTRA.redirectUri`: `"http://localhost:3000/auth/callback"`
  - `FRAMEWORK_UI_NAVBAR`: nav items from plan
  - `FRAMEWORK_UI_AUTH_SCOPES`: required API scopes from plan
- `index.html`: set `<title>` to app display name

4c. Create source structure per plan:
```
src/
├── pages/<PageName>/<PageName>.tsx    ← one file per page
├── components/                         ← shared UI components
├── services/<feature>Api.ts            ← API calls (never in components)
├── types/<feature>.types.ts            ← TypeScript interfaces
└── router.tsx                          ← routes from plan
```

Every page: MUI components, service calls only, loading + error states, TypeScript types, protected via `loader: requireAuth()` unless explicitly public.

4d. Create frontend test stubs. For each page, create `test/unit/<PageName>.test.tsx`:
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

4e. Create `docker-compose.yml` at frontend repo root:
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

4f. Create `.devcontainer/devcontainer.json`:
```json
{
  "name": "<app-name>",
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

4g. Copy Helm chart. Copy `/templates/helm/` → `/repos/<app-name>/helm/`. Apply frontend-specific Helm config from plan:
- `helm/Chart.yaml`: name → `<app-name>-frontend`, description
- `helm/values.yaml`: app.name, image.repository, istio.pathPrefix → `/`, serviceAccount.name
- All `values-*.yaml`: env-specific istio.hosts; azureWorkloadIdentityClientId as empty placeholder

### Step 5 — Generate `.github/copilot-instructions.md` for each repo
Each repo gets its own copilot-instructions tailored to its concern.

**5a. API repo** — Create `/repos/<app-name>-backend/.github/copilot-instructions.md`:
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
<list each table from plan with a one-line description>

## Key Files
- `docs/openapi.yaml` — API contract; update this BEFORE adding routes (contract-first)
- `.env.example` → `.env` — environment variable reference for local setup
- `docker-compose.yml` — local: SQL Server + Flyway + backend (Flyway reads ../db-<app-name>/migrations)
- `postman/collections/<app-name>.json` — API test collection
- `helm/` — Kubernetes deployment chart
```

Part 2 — Read spec kit's `.github/qwen-instructions.md` (or `copilot-instructions.md`). Copy every section from `## API Standards` through end of file verbatim. Do NOT copy spec-kit-specific content before that heading.

**5b. Frontend repo** — Create `/repos/<app-name>-frontend/.github/copilot-instructions.md`:
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
- `docker-compose.yml` — local: frontend dev server (backend runs separately from <app-name>-backend)
- `helm/` — Kubernetes deployment chart
```

Part 2 — Same as above: copy from `## API Standards` through end of spec kit instructions.

### Step 6 — Create READMEs for each repo
**6a.** `/repos/<app-name>-backend/README.md`:
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

**Requires `db-<app-name>` cloned as a sibling directory** — docker-compose mounts migrations from `../db-<app-name>/migrations`.

```bash
cp .env.example .env
# edit .env
docker compose up
```
```

**6b.** `/repos/<app-name>-frontend/README.md`:
```markdown
# <App Name>

<One-line description>

## Structure
- `src/pages/` — one directory per page
- `src/services/` — API service modules (all API calls live here)
- `public/static-config.json` — Entra auth config (clientId/authority set at deploy)
- `helm/` — Kubernetes deployment chart

## Local development
The backend must be running from `<app-name>-backend` on port 8080.

```bash
docker compose up
```
```

### Step 7 — Copy requirements and plan into each repo
Copy spec context into all three repos so developers have full background without needing access to spec-kit:

**API repo** — copy into `<app-name>-backend/docs/spec/`:
- All files from `requirements/<app-name>/` → `docs/spec/requirements/`
- `plans/<app-name>/PLAN.md` → `docs/spec/PLAN.md`

**Frontend repo** — copy into `<app-name>-frontend/docs/spec/`:
- All files from `requirements/<app-name>/` → `docs/spec/requirements/`
- `plans/<app-name>/PLAN.md` → `docs/spec/PLAN.md`

### Step 8 — Self-audit
Verify before reporting complete:

1. No hardcoded secrets in any repo (Entra clientId/secret, DB passwords, JWT secrets as literal values)
2. Every API endpoint in plan has a route file, service stub, and `docs/openapi.yaml` entry — with all required status codes, parameter schemas, request body schemas
3. Every DB table in plan has a Flyway migration in `db/migrations/`
4. Every frontend page in plan has a `.tsx` file
5. No `any` types in any TypeScript file
6. No `console.log` in any production code file
7. All SQL uses parameterized queries — no string concatenation
8. `@fastify/helmet` and `@fastify/rate-limit` registered in `app.ts`
9. JWT middleware validates `algorithms`, `issuer`, `audience`
10. CORS configured with env var origins (no wildcards)
11. Helm values have no leftover placeholder strings except those marked "set at deploy time"
12. `flyway.conf` is NOT present — only `flyway.conf.example`
13. `.env.example` exists and contains every environment variable in plan
14. `.github/workflows/ci.yml` has no remaining `templateweb` references
15. `.github/copilot-instructions.md` exists in all repos with app-specific structure sections
16. `.devcontainer/devcontainer.json` exists in all repos
17. `postman/environments/<app-name>-local.postman_environment.json` exists
18. Every backend feature has a test stub in `tests/unit/`
19. Every frontend page has a test stub in `test/unit/`
20. `docs/spec/requirements/` and `docs/spec/PLAN.md` exist in all repos

Report any gaps found.

### Step 9 — Output summary
List all files created, organized by repo. Note any items from plan not fully implemented and explain why.
