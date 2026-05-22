# LLD — LiquidityEventOS

## Product separation
LiquidityEventOS runs as an isolated standalone SaaS product with its own Entra configuration, APIs, workers, storage, cache, and deployment artifacts.

## Local development model
LiquidityEventOS must support local development in a **devcontainer**.

### Required top-level repo layout
- `/frontend` — React + MUI UI
- `/backend` — Node.js API, workers, collaboration logic
- `/database` — Flyway migrations, seeds, database assets
- `/.devcontainer` — containerized local dev definition

### Devcontainer services
- development container
- MSSQL container
- Redis container
- Flyway container to deploy and migrate schema

## Identity design
- Entra OIDC login for SPA
- API bearer token validation against product app registration
- local RBAC and collaborator access model in product database

Suggested auth tables:
- users
- tenant_users
- collaborator_access
- roles
- permissions
- user_roles
- auth_identities

## Domain entities
- Person
- Company
- Grant
- VestingSchedule
- LiquidityEvent
- Scenario
- ScenarioOutcome
- PlanningOpportunity
- ChecklistItem
- CollaboratorAccess
- Report

## API route suggestions
- GET/POST /auth/me
- GET/POST /liquidity-event/companies
- GET/POST /liquidity-event/persons
- GET/POST /liquidity-event/grants
- POST /liquidity-event/scenarios/run
- GET /liquidity-event/scenarios/:id
- GET /liquidity-event/persons/:id/opportunities
- POST /liquidity-event/persons/:id/reports

## Worker flows
### document-assisted grant ingestion
1. document uploaded
2. extraction job published
3. extracted fields reviewed and persisted
4. scenario rerun prompt emitted

### scenario comparison
1. assumptions selected
2. worker computes deterministic outcomes
3. opportunities and checklist items generated
4. report generated on demand

## Database development standard
Use **Flyway** for all DDL and versioned schema updates.

### `/database` structure suggestion
- `/database/migrations`
- `/database/repeatable`
- `/database/seeds`
- `/database/conf`
- `/database/docs`

### Devcontainer DB workflow
- MSSQL starts locally in container
- Flyway container runs migrate
- optional seed load runs for sample grants/scenarios
- backend starts after DB is migrated and reachable

## Infrastructure notes
- dedicated Blob containers such as `liquidityevent-raw-documents` and `liquidityevent-reports`
- dedicated Redis usage for scenario dedupe and state
- product-isolated deployment pipeline and AKS manifests
