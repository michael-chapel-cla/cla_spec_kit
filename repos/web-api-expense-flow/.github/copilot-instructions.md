# Copilot Instructions — web-api-expense-flow

## What this repo is

The ExpenseFlow backend REST API. Fastify + TypeScript, deployed as a container.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript (ESM) |
| Framework | Fastify via `framework-nodejs-fastify` |
| Auth | Azure Entra (JWKS RS256), `jsonwebtoken` + `jwks-rsa` |
| Database | MSSQL via `mssql` ConnectionPool |
| Validation | Zod on all request bodies |
| Testing | Vitest, 85% coverage floor |
| Linting | ESLint via `framework-eslint-config` |

## Structure

```
src/
  app.ts                        # Fastify instance, plugin registration
  server.ts                     # Entry point
  shared/
    auth/auth.middleware.ts      # authMiddleware + requireScope()
    db/db.client.ts              # createDbClient(), DbClient interface
    errors/error.handler.ts      # Centralised error handler
  features/
    <feature>/v1/
      <feature>.routes.ts
      <feature>.service.ts
      <feature>.schema.ts
      <feature>.types.ts
tests/unit/
docs/
  openapi.yaml
postman/
```

## Conventions

- All routes prefixed `/api/v1/`, PascalCase plural resource names (`/ExpenseReports`, `/Policies`)
- Every route plugin receives `{ db: DbClient }` via `FastifyPluginOptions`
- All SQL via parameterised `.input()` — never string concatenation
- Auth via `requireScope('role1', 'role2')` preHandler
- `tenantId` always sourced from `req.user.tenantId` (JWT claim)
- Error responses: `{ error: string, message: string, timestamp, requestId }`
- 400 for schema parse failures, 422 for business validation, 404/409 for domain errors

## What NOT to help with

- `/templates/` — hands-off, managed by the spec-kit
- `/specs/` — standards docs, not editable
- `/requirements/` and `/plans/` — spec-kit artefacts
