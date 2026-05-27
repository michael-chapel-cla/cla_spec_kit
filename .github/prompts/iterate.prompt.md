---
mode: agent
description: Add a new feature to an already-scaffolded application — generates a feature plan and scaffolds routes, service, migrations, and frontend page into the existing repos.
tools:
  - codebase
  - editFiles
  - findFiles
  - runCommands
---

Add the feature **${input:featureName}** to the existing application **${input:appName}**.

---

## WORKFLOW

### Step 1 — Read the existing app

Read the following to understand what has already been built:

- `plans/${input:appName}/PLAN.md` — original architecture decisions, data model, and endpoint list
- All TypeScript files under `repos/web-api-${input:appName}/src/features/` — existing features and patterns to follow
- `repos/web-api-${input:appName}/src/shared/` — auth middleware, DB client, error handler
- `repos/web-api-${input:appName}/docs/openapi.yaml` — existing API contract
- All `.sql` files under `repos/db-${input:appName}/migrations/` — existing schema; note the highest migration version number
- `repos/web-${input:appName}/src/router.tsx` — existing routes
- `repos/web-${input:appName}/src/services/` — existing service modules
- `repos/web-${input:appName}/src/types/` — existing domain types

---

### Step 2 — Plan the feature

Before writing any code, produce a concise feature plan:

```
## Feature: ${input:featureName}

### New API endpoints
| Method | Path | Auth | Description |
|---|---|---|---|

### New DB tables / columns
| Migration file | Change |
|---|---|

### New frontend pages / components
| Path | Description |
|---|---|

### Changes to existing files
| File | Change |
|---|---|
```

Output this plan to the conversation. Do not proceed until it is complete.

---

### Step 3 — Write the DB migration

Create the next versioned migration file in `repos/db-${input:appName}/migrations/`.

Rules:
- Version must be one patch increment above the current highest — e.g. if the last file is `V1.0.3__...sql` create `V1.0.4__${input:featureName}.sql`
- All new tables must include `Id INT NOT NULL IDENTITY(1,1)`, `TenantId INT NOT NULL`, `CreatedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`, `ModifiedOn DATETIME2 NULL`
- Use `IF NOT EXISTS` guards on all DDL
- Data migrations must use `BEGIN TRANSACTION / COMMIT` with a verification step
- Strings: `NVARCHAR`. Booleans: `BIT`. Timestamps: `DATETIME2`

---

### Step 4 — Scaffold the API feature

Create a new feature directory: `repos/web-api-${input:appName}/src/features/${input:featureName}/v1/`

Generate four files following the exact patterns in the existing features:

**`${input:featureName}.types.ts`** — TypeScript interfaces for request/response bodies and domain objects.

**`${input:featureName}.schema.ts`** — Zod schemas for all request bodies and params.

**`${input:featureName}.service.ts`** — Service class with constructor injection:
```typescript
export class ${FeatureName}Service {
  constructor(private readonly db: DbClient) {}
  // one method per endpoint
}
```
All SQL must use parameterised queries via `db.executeQuery()`. No string concatenation. No `SELECT *`.

**`${input:featureName}.routes.ts`** — Fastify plugin with the correct signature:
```typescript
export async function ${featureName}Routes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) { ... }
```
- Register with `prefix: '/api/v1'` in `app.ts`
- Use `authMiddleware` for any-authenticated-user routes
- Use `requireScope(...)` for role-gated routes — never stack both
- Return 201 + `Location` header on POST, 204 on DELETE

Register the new plugin in `repos/web-api-${input:appName}/src/app.ts`:
```typescript
await app.register(${featureName}Routes, { prefix: '/api/v1', db });
```

---

### Step 5 — Update the OpenAPI spec

Add all new endpoints to `repos/web-api-${input:appName}/docs/openapi.yaml`.

For each endpoint include:
- `summary` and `description`
- `security` (bearerAuth)
- All parameters with types and constraints
- Request body schema (if applicable)
- All expected response status codes with schemas
- At least one example per response

---

### Step 6 — Scaffold the frontend

**Service module** — Create or extend `repos/web-${input:appName}/src/services/${input:featureName}Api.ts`:
```typescript
import axios from 'axios';

export const ${featureName}Api = {
  async list(...): Promise<...> { ... },
  // one function per endpoint
};
```
All API calls go here — never in components.

**Types** — Create or extend `repos/web-${input:appName}/src/types/${input:featureName}.types.ts` with interfaces matching the API response shapes.

**Page component** — Create `repos/web-${input:appName}/src/pages/${FeatureName}/${FeatureName}.tsx`:
- Use MUI v6 components (`Box`, `Typography`, `DataGrid`, `Button`, etc.)
- Call the service module — never call axios directly in the component
- Export as default: `export default function ${FeatureName}() { ... }`

**Router** — Add the new route to `repos/web-${input:appName}/src/router.tsx` with `loader: requireAuth()`.

---

### Step 7 — Write test stubs

**API unit test** — Create `repos/web-api-${input:appName}/tests/unit/${input:featureName}.service.test.ts`:
- Import and instantiate the service with a mock `DbClient`
- Write at least three test cases: happy path, not-found / empty, and validation error
- Use Vitest (`describe`, `it`, `expect`, `vi.fn()`)

**Frontend unit test** — Create `repos/web-${input:appName}/test/unit/${FeatureName}.test.tsx`:
- Use Vitest + React Testing Library
- Test that the page renders without crashing
- Test the loading and error states

---

### Step 8 — Self-audit

Verify before reporting complete:

1. Migration version number is one higher than the previous highest — no duplicate versions
2. New tables have `Id`, `TenantId`, `CreatedOn`, `ModifiedOn`
3. No hardcoded secrets or Entra literals in any new file
4. All SQL uses parameterised queries — no string concatenation
5. Route plugin registered in `app.ts` with `prefix: '/api/v1'`
6. Route plugin signature includes `{ db: DbClient }` in options
7. `requireScope(...)` used on any role-gated routes — not bare `authMiddleware`
8. All new endpoints in `openapi.yaml` with all status codes
9. Frontend service module created — no axios calls inside the page component
10. New route in `router.tsx` has `loader: requireAuth()`
11. Test stubs created in both `web-api-*/tests/unit/` and `web-*/test/unit/`

Report any gaps found.

---

### Step 9 — Output summary

Print a summary:

```
## Feature added: ${input:featureName} → ${input:appName}

### Files created
- repos/db-${input:appName}/migrations/<migration>.sql
- repos/web-api-${input:appName}/src/features/${input:featureName}/v1/${input:featureName}.types.ts
- repos/web-api-${input:appName}/src/features/${input:featureName}/v1/${input:featureName}.schema.ts
- repos/web-api-${input:appName}/src/features/${input:featureName}/v1/${input:featureName}.service.ts
- repos/web-api-${input:appName}/src/features/${input:featureName}/v1/${input:featureName}.routes.ts
- repos/web-${input:appName}/src/services/${input:featureName}Api.ts
- repos/web-${input:appName}/src/types/${input:featureName}.types.ts
- repos/web-${input:appName}/src/pages/${input:featureName}/${input:featureName}.tsx
- repos/web-api-${input:appName}/tests/unit/${input:featureName}.service.test.ts
- repos/web-${input:appName}/test/unit/${input:featureName}.test.tsx

### Files modified
- repos/web-api-${input:appName}/src/app.ts (registered new route plugin)
- repos/web-api-${input:appName}/docs/openapi.yaml (added new endpoints)
- repos/web-${input:appName}/src/router.tsx (added new route)

### Next steps
- Run `docker-compose up` in web-api-${input:appName}/ to apply the new migration
- Run `npm run test` in both repos to verify test stubs pass
- Run /validate ${input:appName} to check compliance
```
