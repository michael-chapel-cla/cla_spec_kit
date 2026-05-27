---
name: spec-kit-design
description: Run /design <app-name> — generate 16 requirement documents from ideas.md
category: software-development
---

# Spec Kit — /design Command

Run this when the user says "design <app-name>" or "/design <app-name>".

## Tech Stack (Fixed)
- **Backend**: Node.js 20 + Fastify + TypeScript
- **Frontend**: React 18 + Vite + TypeScript + MUI v6
- **Database**: MSSQL + Flyway migrations
- **Auth**: Azure Entra (OIDC for SPA, JWT Bearer for API)
- **Infra**: AKS + Helm

## Standard API Conventions (reference in HLD/LLD)
- URI versioning: `/api/v1/ResourceName` (PascalCase plural, no verbs)
- OpenAPI 3.0.3 spec at `docs/openapi.yaml`
- JWT validation: `iss`, `aud`, `exp`, `alg` (RS256)
- Feature-based code organization: `src/features/<feature>/v1/`
- DB migrations: `V{major}.{minor}.{patch}__{description}.sql`

## Workflow

### Step 1 — Read the idea
Read `/ideas/<app-name>/ideas.md`. Check for any image files (PNG, JPG, WEBP) in that directory — incorporate them as visual context.

### Step 2 — Review examples
Read all files in `/requirements/example/` to understand expected format, depth, and tone. Use as structural model — content must come from the ideas.

### Step 3 — Create output directory
Create `/requirements/<app-name>/` if it doesn't exist.

### Step 4 — Generate all 16 requirement documents
Write each to `/requirements/<app-name>/`. Every document must be substantive and specific — no generic filler.

Required files:
1. **README.md** — app name, repo suggestion (kebab-case), list of all 16 docs
2. **EXECUTIVE_SUMMARY.md** — product, problem, timing, solution, target market, commercial case
3. **PRD.md** — product name, problem statement, ICP, JTBD (3-5 jobs), alternatives, gap, core features (6-10), AI opportunities, MVP scope, success metrics
4. **PITCH.md** — 4-6 paragraph investor pitch (problem, solution, wedge, moat, market)
5. **HLD.md** — product stance, identity model (Entra OIDC + JWT), overview, primary users, core capabilities, runtime architecture (React SPA → Fastify API → MSSQL), logical modules, core flow, scale characteristics, Redis usage, risks
6. **LLD.md** — product separation, local dev model (devcontainer + Docker Compose), repo layout (`backend/`, `db/`, `frontend/`, `helm/`), devcontainer services (MSSQL, db-init, Flyway, backend, frontend), identity design (SPA: Entra OIDC via framework-react-core/MSAL; API: JWT Bearer RS256), domain entities, API route suggestions (`METHOD /api/v1/ResourceName`), worker flows, DB standard (Flyway migrations), `/db` structure, local DB workflow (`docker compose run flyway migrate`), infra notes
7. **SYSTEM_ARCHITECTURE.md** — architectural layers (presentation → API → business logic → data), core principles, component relationship diagram (text), data flow, external integrations
8. **DATA_MODEL.md** — core entities with key fields, relationships (cardinality), indexes/constraints, multi-tenancy strategy, complex domain rules
9. **MVP_BUILD_SPEC.md** — MVP goal (one paragraph), stack components, MVP workflows (numbered user journeys), out-of-scope items, guardrails
10. **COMPETITIVE_ANALYSIS.md** — category map, vendor comparison (Strength/Weakness/Gap), opportunity summary
11. **CUSTOMER_PERSONAS.md** — 3-5 personas (name/role, motivation, pain point, how product helps)
12. **ROADMAP.md** — Phase 1 MVP (aligns with MVP_BUILD_SPEC), Phase 2 expansion, Phase 3 scale, future stretch features
13. **LANDING_PAGE.md** — headline, subhead, 4-6 benefit bullets, primary CTA
14. **GO_TO_MARKET.md** — best first channel(s), wedge offer, sales motion (PLG vs high-touch), messaging priorities, partnerships/integrations
15. **PRICING_AND_POSITIONING.md** — positioning statement, buyer profile, pricing tiers (indicative ranges), value drivers, risks
16. **MARKET_PRIORITIZATION.md** — scorecard (rate each 1-10: market size, ease of build, speed to revenue, urgency of pain, buyer clarity, trust/compliance burden), summary paragraph, why it can win, why harder

### Step 5 — Confirm
Output a brief summary listing files created and any assumptions made where ideas lacked detail.

## Important Constraints
- Do NOT modify `/templates/`, `/specs/`, or `/helm/`
- Content must be specific to the app — no placeholder text
