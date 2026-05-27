# web-api-expense-flow

Fastify REST API for the ExpenseFlow expense management platform. Handles expense reports, approval workflow, policy enforcement, and finance reporting.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- [db-expense-flow](../db-expense-flow) cloned as a sibling directory (the API docker-compose mounts `../db-expense-flow/migrations` for Flyway)

## Local development

```bash
# Clone all three repos as siblings
git clone <url>/web-api-expense-flow
git clone <url>/web-expense-flow
git clone <url>/db-expense-flow

# Install dependencies
cd web-api-expense-flow
npm install

# Copy environment template and fill in values
cp .env.example .env

# Start the full stack (DB + Flyway migrations + API)
docker-compose up
```

The API listens on `http://localhost:8080`.

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_SERVER` | SQL Server hostname |
| `DATABASE_NAME` | Database name |
| `DATABASE_USER` | SQL login |
| `DATABASE_PASSWORD` | SQL password |
| `ENTRA_ISSUER` | Azure Entra issuer URL |
| `ENTRA_AUDIENCE` | API App ID URI (`api://expense-flow`) |
| `BLOB_ACCOUNT_NAME` | Azure Storage account name |
| `BLOB_ACCOUNT_KEY` | Azure Storage account key |
| `PORT` | HTTP port (default: 8080) |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGINS` | Comma-separated allowed origins |

## Scripts

```bash
npm run dev          # ts-node watch mode
npm run build        # Compile to dist/
npm test             # Vitest with coverage
npm run lint         # ESLint
```

## API reference

See `docs/openapi.yaml` or import `postman/collections/expense-flow.json` into Postman with `postman/environments/expense-flow-local.postman_environment.json`.

## Project structure

```
src/
  app.ts                   # Plugin registration
  server.ts                # Entry point
  shared/
    auth/                  # JWKS JWT middleware + requireScope()
    db/                    # MSSQL connection pool
    errors/                # Centralised error handler
  features/
    expenseReports/v1/
    expenseLineItems/v1/
    receipts/v1/
    approvals/v1/
    users/v1/
    policies/v1/
    reports/v1/
tests/unit/
docs/
  openapi.yaml
  ops/runbook.md
postman/
helm/
```

## Helm deployment

```bash
helm upgrade --install web-api-expense-flow ./helm \
  -f ./helm/values-dev.yaml \
  --set image.tag=<image-tag>
```
