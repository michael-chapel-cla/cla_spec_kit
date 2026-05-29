# CLA Spec Kit

An "easy button" for starting new applications on the organization's fixed stack. Go from a raw idea to a fully scaffolded, standards-compliant application in three GitHub Copilot agent commands — then continue building with Copilot against the generated scaffold.

---

## How It Works

```
You write an idea  →  /design  →  /plan  →  /create  →  /validate  →  Copilot builds features
```

| Stage | Command | Input | Output |
|---|---|---|---|
| 0 (optional) | `/audit-idea` | `ideas/<app-name>/ideas.md` | Pre-flight report: READY / NEEDS WORK / BLOCKED verdict before running `/design` |
| 1 | `/design` | `ideas/<app-name>/ideas.md` (+ optional images + supplementary `.md` files) | 16 requirement documents in `requirements/<app-name>/` |
| 2 | `/plan` | The requirements from Stage 1 | `plans/<app-name>/PLAN.md` |
| 3 | `/create` | The plan from Stage 2 | Three repos: `web-api-<app>/`, `web-<app>/`, `db-<app>/` — each with a `DEVELOPER_GUIDE.md` |
| 4 | `/validate` | The generated repos | Scored compliance report (8 categories: security, quality, API, DB, Docker, frontend, framework, testing, accessibility) |
| 5 | Copilot Chat (ongoing) | The scaffold + `.github/copilot-instructions.md` | Feature development |
| — | `/iterate` | Existing repos + feature name | New migration, API feature, OpenAPI entries, frontend page, and test stubs added to the repos |
| — | `/docs` | Existing repos + plan | Regenerated `DEVELOPER_GUIDE.md` in each repo (run standalone if guides become stale) |

The commands are available two ways:
- **GitHub Copilot agent prompts** in `.github/prompts/` — run in Copilot Chat agent mode, Copilot prompts for the app name
- **Claude Code slash commands** in `.claude/commands/` — run as `/design <app-name>` directly in Claude Code

Everything after scaffolding continues in Copilot Chat (or Claude Code) using `.github/copilot-instructions.md` for stack rules and coding standards.

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
    ├── ideas.md                    ← required: primary idea description
    ├── technical-constraints.md    ← optional: infrastructure limits, integration requirements
    ├── competitor-notes.md         ← optional: detailed competitive research
    └── mockup.png                  ← optional: Figma exports, wireframes, screenshots
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

**Multi-file ideas**: any extra `.md` files in the folder are merged as supplementary context by `/design`. Use them when a single file gets too long or when different people own different parts of the idea (e.g., a product manager owns `ideas.md`, an engineer writes `technical-constraints.md`).

**API-only apps**: add `**Type: API-only**` at the top of `ideas.md` and `/design`/`/create` will skip the frontend scaffold — only `web-api-<app>` and `db-<app>` are generated. See `ideas/README.md` for the API-only template.

**Pre-flight check**: before running `/design`, run `/audit-idea my-new-app` to get a READY / NEEDS WORK / BLOCKED verdict and a list of gaps to fix first.

Add screenshots or Figma exports to the same folder — `/design` extracts pages, navigation structure, MUI components, data entities, and user roles directly from the images.

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
| `TDD.md` | Named test cases for every feature and page — consumed by `/create` to write test files before implementation |

**Review these documents before running `/plan`.** Edit anything that is wrong — `/plan` reads them as its input.

See `requirements/expense-flow/` for what each document looks like when complete.

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

This reads the plan and the coding standards in `specs/`, then builds three independent repos:

```
repos/
├── web-api-my-new-app/   ← Node.js + Fastify + TypeScript API
├── web-my-new-app/       ← React + Vite + TypeScript + MUI SPA
└── db-my-new-app/        ← Flyway SQL migrations
```

Each repo has its own `helm/`, `docker-compose.yml`, `.devcontainer/`, and `.github/workflows/ci.yml`.

The scaffold includes:
- Feature-organized routes, services, schemas, and types for every endpoint in the plan
- Auth middleware with full JWT validation (RS256, issuer, audience)
- DB client with connection pooling and parameterized query helpers
- `docs/openapi.yaml` for all endpoints (written before route code — contract-first)
- `docs/spec/` in every repo — full requirements and plan copied in for developer context
- `DEVELOPER_GUIDE.md` in every repo — local setup steps, env var table, auth explanation, and how to add a feature or migration, all specific to this app
- Postman collection with test scripts
- Unprotected `GET /health` and `GET /health/ready` endpoints
- Flyway migrations for every table in the data model
- React pages, service modules, and router with protected routes
- Helm chart with environment-specific values files
- `docker-compose.yml` for local development
- GitHub Actions CI/CD workflow (lint → test → build → deploy dev → qa → uat → prod)

`/create` finishes with a self-audit confirming no hardcoded secrets, missing routes, missing migrations, or missing pages.

---

### 5. Validate the Scaffold

Run `/validate my-new-app` (Copilot) or `/validate my-new-app` (Claude Code) to audit the generated scaffold against all coding standards. It produces a scored report (0–100) with findings grouped by category:

- **Security** — hardcoded secrets, SQL injection, JWT validation, CORS, rate limiting, OWASP patterns
- **Code Quality** — TypeScript `any`, `console.log`, async patterns, direct API calls in components
- **API Standards** — URI versioning, HTTP status codes, OpenAPI spec, Postman collection
- **DB Migrations** — naming convention, `SELECT *`, transaction patterns, `flyway.conf` not committed
- **Docker Compose** — Flyway sibling-repo mount path, no hardcoded secrets, health checks, service scope
- **Frontend** — service layer, `requireAuth()` coverage, `static-config.json` fields, MUI theme
- **Framework Compliance** — startup sequence, route plugin signature, `requireScope`, `claTheme`
- **Testing** — service/route test files present, no `.only` in tests, coverage thresholds ≥ 85%, RTL used
- **Accessibility** — WCAG 2.1 AA: keyboard reachability, ARIA labels, form associations, focus management

Fix any CRITICAL or HIGH findings before starting feature development.

---

### 6. Continue Development with GitHub Copilot

The scaffold is ready for active development. Each generated app is an **independent repository candidate** — it is not committed to this spec-kit repo.

**Initialize repos for your app:**

```bash
# Each of the three generated repos becomes its own git repository
cd repos/web-api-my-new-app && git init && git add . && git commit -m "Initial scaffold" && git remote add origin https://github.com/your-org/web-api-my-new-app.git && git push -u origin main
cd ../web-my-new-app        && git init && git add . && git commit -m "Initial scaffold" && git remote add origin https://github.com/your-org/web-my-new-app.git && git push -u origin main
cd ../db-my-new-app         && git init && git add . && git commit -m "Initial scaffold" && git remote add origin https://github.com/your-org/db-my-new-app.git && git push -u origin main
```

**Start the local dev environment:**

The three repos must be cloned as siblings — the API docker-compose mounts `../db-my-new-app/migrations` for Flyway.

```bash
# 1. Configure the API
cp repos/web-api-my-new-app/.env.example repos/web-api-my-new-app/.env
# Edit .env — fill in: DATABASE_SERVER, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD,
#                       ENTRA_ISSUER, ENTRA_AUDIENCE, BLOB_ACCOUNT_NAME, BLOB_ACCOUNT_KEY

# 2. Configure frontend auth
# Edit repos/web-my-new-app/public/static-config.json — fill in clientId and authority

# 3. Start the API stack (DB + Flyway migrations + API)
cd repos/web-api-my-new-app
npm install
docker-compose up          # http://localhost:8080

# 4. Start the frontend (separate terminal)
cd repos/web-my-new-app
npm install
npm run dev                # http://localhost:3000
```

**Adding features after launch**: run `/iterate my-new-app <feature-name>` to scaffold a new feature into the existing repos — it reads the current codebase, plans the migration + API + frontend page, writes all the files, and runs a self-audit.

**Then use GitHub Copilot Chat or Claude Code to build features.** Both read `.github/copilot-instructions.md` (Copilot) or `.github/qwen-instructions.md` (local models via Claude Code) and apply the organization's coding standards automatically — you do not need to explain the stack or the rules.

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
| **Frontend rules** | Service layer required (no API calls in components), `requireAuth()` on all protected routes, `static-config.json` required fields, explicit return types, default exports on pages only |
| **Framework compliance** | `FrameworkFastify.create()` startup sequence, route plugin signature with `{ db }`, `requireScope` for role-gated routes, `claTheme` via `lib-seamlesscomponents-react`, `framework-eslint-config` in all repos |
| **Testing** | Vitest + RTL required, every service and route has a test file, no `.only` in committed tests, no mssql mocking in integration tests, coverage thresholds ≥ 85% enforced in `vitest.config.ts` |
| **Accessibility** | WCAG 2.1 AA — keyboard reachability, alt text, form label associations, icon button `aria-label`, Dialog/Tab/DataGrid ARIA patterns, no `outline:none` without replacement |

---

## Directory Reference

```
cla_spec_kit/
├── CLAUDE.md             ← Scopes Claude Code to the four spec-kit commands
├── AGENTS.md             ← AI agent context and guardrails
├── ideas/                ← YOU CREATE: ideas/<app-name>/ideas.md + optional images
├── requirements/         ← /design writes here
│   └── expense-flow/     ← 16 reference documents showing expected output
├── plans/                ← /plan writes here
├── repos/                ← /create writes here — generated apps live here
├── specs/                ← Coding standards (read-only)
│   └── context/          ← 8 distilled audit rule files used by /validate
│       ├── 01-security.md
│       ├── 02-code-quality.md
│       ├── 03-api-standards.md
│       ├── 04-db-migrations.md
│       ├── 05-frontend.md
│       ├── 06-framework.md
│       ├── 07-testing.md         ← Vitest patterns, RTL, coverage thresholds, test structure
│       ├── 08-accessibility.md   ← WCAG 2.1 AA rules auditable from source
│       └── 09-tdd.md             ← TDD guardrails: test-first ordering, contract-derived test cases
├── templates/            ← Starter templates used by /create (read-only)
│   ├── framework-nodejs-starter-kit/
│   ├── framework-react-starter-kit/
│   ├── framework-db-starter-kit/  ← Flyway + docker-compose template for db-<app> repos
│   └── helm/             ← Helm chart template for AKS deployment
└── .claude/
    └── commands/         ← Claude Code slash commands
        ├── design.md     ← /design <app-name>
        ├── plan.md       ← /plan <app-name>
        ├── create.md     ← /create <app-name>
        ├── validate.md   ← /validate <app-name>
        ├── audit-idea.md ← /audit-idea <app-name>
        ├── iterate.md    ← /iterate <app-name> <feature-name>
        └── docs.md       ← /docs <app-name>
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
| CI/CD | GitHub Actions |

---

## Rules for This Repo

**Do not modify** — changes here affect every app generated afterward:
- `templates/` — the master starter templates (including `templates/helm/`)
- `specs/` — the organization's coding standards
- `requirements/expense-flow/` — the reference documents used by `/design`

**Do not commit generated apps** — `repos/<app-name>/` directories are gitignored. Each generated app becomes its own independent repository.
