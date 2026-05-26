# CLA Spec Kit

An "easy button" for starting new applications on the organization's fixed stack. Go from a raw idea to a fully scaffolded, standards-compliant application in three GitHub Copilot agent commands — then continue building with Copilot against the generated scaffold.

---

## How It Works

```
You write an idea  →  /design  →  /plan  →  /create  →  Copilot builds features
```

| Stage | Copilot Agent Prompt | Input | Output |
|---|---|---|---|
| 1 | `/design` | `ideas/<app-name>/ideas.md` (+ optional images) | 16 requirement documents in `requirements/<app-name>/` |
| 2 | `/plan` | The requirements from Stage 1 | `plans/<app-name>/PLAN.md` |
| 3 | `/create` | The plan from Stage 2 | Full app scaffold in `repos/<app-name>/` |
| 4 | Copilot Chat (ongoing) | The scaffold + `.github/copilot-instructions.md` | Feature development |

All three commands are **GitHub Copilot reusable prompts** defined in `.github/prompts/`. They run in Copilot Chat agent mode — Copilot will prompt you for the app name and then execute the full workflow. Everything after scaffolding continues in Copilot Chat using `.github/copilot-instructions.md` for stack rules and coding standards.

---

## Getting Started

### Open in Devcontainer (Recommended)

Open this repo in VS Code and reopen in the devcontainer. It provides:

- Node.js 20
- Docker-in-Docker (for running generated app stacks locally)
- GitHub Copilot and Copilot Chat extensions pre-installed
- ESLint, Prettier, YAML, and Docker extensions
- Ports 3000 (frontend), 8080 (backend), 6006 (Storybook) forwarded automatically

> **Azure credentials**: The devcontainer mounts `~/.azure` from your host. Run `az login` on your host machine before opening the devcontainer so generated apps can reach Azure resources.

### Local Setup (without devcontainer)

Requires: Node.js 20+, Docker Desktop, VS Code with the GitHub Copilot extension.

---

## Step-by-Step: Building a New App

### 1. Write Your Idea

Create the file `ideas/<app-name>/ideas.md`. Use kebab-case for the app name — it becomes the directory name everywhere.

```
ideas/
└── my-new-app/
    ├── ideas.md          ← required
    └── mockup.png        ← optional (Figma exports, wireframes, screenshots)
```

Your `ideas.md` should cover:

```markdown
# App Name

## What is it?
One paragraph describing the product.

## The problem it solves
What pain does it address? Who has this pain?

## Key features
- Feature 1
- Feature 2
- Feature 3

## Target users
Who will use this?

## Out of scope / constraints
What is this NOT?

## Additional context
Domain knowledge, regulatory requirements, integration needs, etc.
```

Add screenshots or Figma exports to the same folder — `/design` reads them as visual context.

---

### 2. Generate Requirements

In **GitHub Copilot Chat**, type `/design` and select the prompt from the list. Copilot will ask for the app name — enter `my-new-app`.

This reads your idea file (and any images) and generates 16 requirement documents in `requirements/my-new-app/`:

| Document | Contents |
|---|---|
| `README.md` | App overview and document index |
| `EXECUTIVE_SUMMARY.md` | Problem, solution, commercial case |
| `PRD.md` | Features, ICP, JTBD, success metrics |
| `PITCH.md` | Investor/stakeholder pitch |
| `HLD.md` | High-level architecture and module design |
| `LLD.md` | Directory structure, API routes, domain entities |
| `SYSTEM_ARCHITECTURE.md` | Layers, components, data flow |
| `DATA_MODEL.md` | Core entities, relationships, indexes |
| `MVP_BUILD_SPEC.md` | What "done" looks like at launch |
| `COMPETITIVE_ANALYSIS.md` | Competitors and gaps to exploit |
| `CUSTOMER_PERSONAS.md` | 3–5 detailed user personas |
| `ROADMAP.md` | MVP → expansion → scale phases |
| `LANDING_PAGE.md` | Headline, benefits, CTA copy |
| `GO_TO_MARKET.md` | Channels, wedge offer, sales motion |
| `PRICING_AND_POSITIONING.md` | Tiers, value drivers, buyer profile |
| `MARKET_PRIORITIZATION.md` | Scored market assessment |

**Review these documents before running `/plan`.** Edit anything that is wrong — `/plan` reads them as its input.

See `requirements/example/` for what each document looks like when complete.

---

### 3. Generate the Build Plan

In **GitHub Copilot Chat**, type `/plan` and enter `my-new-app` when prompted for the app name.

This reads all 16 requirement documents and produces `plans/my-new-app/PLAN.md` containing:

- Architecture decisions (auth strategy, DB schema approach, caching)
- Complete file and directory tree — every feature folder, every page
- Every API endpoint with method, path, auth, request/response types, and all status codes
- Full database schema with exact Flyway migration file names
- Frontend pages with their routes, MUI components, and service calls
- Helm configuration changes from template defaults
- Azure Entra app registration details
- All required environment variables
- Phased build roadmap (MVP → expansion → scale)
- Local dev setup commands

**Review `plans/my-new-app/PLAN.md` before running `/create`.** This is the right place to adjust scope, rename endpoints, or change what is in vs. out of the MVP. What is in the plan is what gets built.

---

### 4. Scaffold the Application

In **GitHub Copilot Chat**, run:

```
/create my-new-app
```

This reads the plan and the coding standards in `specs/`, then builds a complete application at `repos/my-new-app/`:

```
repos/my-new-app/
├── backend/              ← Node.js + Fastify + TypeScript
├── db/                   ← Flyway SQL migrations
├── frontend/             ← React + Vite + TypeScript + MUI
└── helm/                 ← AKS Helm chart
```

The scaffold includes:
- Feature-organized routes, services, schemas, and types for every endpoint in the plan
- Auth middleware with full JWT validation (RS256, issuer, audience)
- DB client with connection pooling and parameterized query helpers
- `docs/openapi.yaml` for all endpoints (written before route code — contract-first)
- Postman collection with test scripts
- Unprotected `GET /health` and `GET /health/ready` endpoints
- Flyway migrations for every table in the data model
- React pages, service modules, and router with protected routes
- Helm chart with environment-specific values files
- `docker-compose.yml` for local development

`/create` finishes with a self-audit confirming no hardcoded secrets, missing routes, missing migrations, or missing pages.

---

### 5. Continue Development with GitHub Copilot

The scaffold is ready for active development. Each generated app is an **independent repository candidate** — it is not committed to this spec-kit repo.

**Initialize a repo for your app:**

```bash
cd repos/my-new-app
git init
git add .
git commit -m "Initial scaffold from CLA spec kit"
git remote add origin https://github.com/your-org/my-new-app.git
git push -u origin main
```

**Start the local dev environment:**

```bash
cd repos/my-new-app

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — fill in: DB_*, ENTRA_ISSUER, ENTRA_AUDIENCE, CORS_ORIGINS

# Configure frontend auth (local dev only)
# Edit frontend/public/static-config.json — fill in clientId and authority

# Start database and run migrations
docker compose --env-file backend/.env up -d db
docker compose --env-file backend/.env run --rm db-init
docker compose --env-file backend/.env run --rm flyway migrate

# Start the app
cd backend && npm run dev     # http://localhost:8080
cd ../frontend && npm run dev # http://localhost:3000
```

**Then use GitHub Copilot Chat to build features.** Copilot reads `.github/copilot-instructions.md` and applies the organization's coding standards automatically — you do not need to explain the stack or the rules.

---

## What Copilot Knows (via `.github/copilot-instructions.md`)

The instructions file gives Copilot full context on every standard, with ❌/✅ examples for each rule:

| Area | What's covered |
|---|---|
| **API standards** | URI versioning, PascalCase plural resources, HTTP method contracts, all status codes, standard error format, OpenAPI contract-first, Postman requirements |
| **Security** | No hardcoded secrets, parameterized SQL only, full JWT validation (RS256 + issuer + audience), no wildcard CORS, rate limiting, security headers, no sensitive data in logs |
| **Code quality** | No TypeScript `any`, no `console.log`, async/await only, service layer required, 85% test coverage, React hook rules |
| **Database** | Flyway migration naming, table schema standards, no `SELECT *`, transaction patterns, repeatable migrations for stored procedures |
| **Authentication** | `framework-react-core` handles SPA auth (never reimplement), JWT bearer for API, Entra config from `static-config.json` |

---

## Directory Reference

```
cla_spec_kit/
├── ideas/                ← YOU CREATE: ideas/<app-name>/ideas.md + optional images
├── requirements/         ← /design writes here
│   └── example/          ← 16 reference documents showing expected output
├── plans/                ← /plan writes here
├── repos/                ← /create writes here — generated apps live here
├── specs/                ← Coding standards (read-only)
│   ├── API_STANDARDS.md
│   ├── CODE_QUALITY_SPECS.md
│   ├── FLYWAY_DB_SPECS.md
│   ├── FRAMEWORK_SPECS.md
│   └── context/          ← Distilled audit rules embedded in the agent commands
├── templates/            ← Starter templates used by /create (read-only)
│   ├── framework-nodejs-starter-kit/
│   └── framework-react-starter-kit/
└── helm/                 ← Helm chart template used by /create (read-only)
```

---

## Fixed Tech Stack

All generated applications use this stack. There is no configuration — the templates, specs, and Helm chart are all built for it.

| Layer | Technology |
|---|---|
| Backend | Node.js 20 + Fastify + TypeScript |
| Frontend | React 18 + Vite + TypeScript + MUI v6 |
| Database | MSSQL (SQL Server) + Flyway migrations |
| Auth | Azure Entra — OIDC for SPA, JWT bearer for API |
| Local dev | Docker + Docker Compose |
| Deployment | AKS + Helm |
| CI/CD | Azure Pipelines |

---

## Rules for This Repo

**Do not modify** — changes here affect every app generated afterward:
- `templates/` — the master starter templates
- `specs/` — the organization's coding standards
- `helm/` — the base Helm chart template
- `requirements/example/` — the reference documents used by `/design`

**Do not commit generated apps** — `repos/<app-name>/` directories are gitignored. Each generated app becomes its own independent repository.
