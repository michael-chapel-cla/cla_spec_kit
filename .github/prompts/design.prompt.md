---
mode: agent
description: Generate the complete requirements documentation for a new application from an idea file.
tools:
  - codebase
  - editFiles
  - findFiles
---

Generate the complete requirements documentation for the application named **${input:appName}**.

---

## TECH STACK CONTEXT

All apps built with this spec-kit use a fixed stack. Write all technical sections of the requirements with this stack in mind — the HLD and LLD must reflect this architecture:

**Backend**: Node.js 20 + Fastify + TypeScript
**Frontend**: React 18 + Vite + TypeScript + MUI (Material UI) v6
**Database**: MSSQL (SQL Server) + Flyway versioned migrations
**Auth**: Azure Entra (OIDC for the SPA via `framework-react-core`, JWT Bearer for the API)
**Infra**: Docker + Docker Compose (local dev) → AKS + Helm (production)
**CI/CD**: GitHub Actions

**Standard API conventions (reference in HLD/LLD):**
- URI versioning: all routes at `/api/v1/ResourceName`
- PascalCase plural resource names
- OpenAPI 3.0.3 spec at `docs/openapi.yaml`
- JWT validation: `iss`, `aud`, `exp`, `alg` (RS256) — no exceptions
- Feature-based code organization: `src/features/<feature>/v1/`
- DB migrations: `V{major}.{minor}.{patch}__{description}.sql` in `db/migrations/`
- Stored procedures/views: `R__{name}.sql` repeatable migrations
- All tables include: `Id INT IDENTITY(1,1)`, `CreatedOn DATETIME2`, `ModifiedOn DATETIME2`

---

## WORKFLOW

### Step 1 — Read the idea files

Scan `ideas/${input:appName}/` for all files. Read them in this order:

1. **`ideas.md`** (required) — the primary idea file; if missing, stop and report an error.
2. **Any other `.md` files** in the same directory — treat these as supplementary context that expands or refines the primary idea. Common examples:
   - `technical-constraints.md` — infrastructure limits, integration requirements, or non-negotiable tech choices
   - `competitor-notes.md` — detailed competitive analysis or positioning research
   - `personas.md` — extended user research or role definitions
   - `open-questions.md` — unresolved design decisions to flag in the requirements
   - Any other `.md` files the author has placed there

   Merge supplementary files with `ideas.md`: content from supplementary files folds into whichever requirement documents it is most relevant to. Do not treat supplementary files as separate sections — synthesise them. If a supplementary file contradicts `ideas.md`, flag the conflict in a comment in the relevant requirement document.

3. **Any image files (PNG, JPG, JPEG, WEBP, PDF)** — Figma exports, wireframes, or UI sketches. Treat them as primary design input, not decoration.

**When images are present, extract the following before writing any requirements:**

- **Pages / screens** — list every distinct screen visible in the images; these become frontend pages in `LLD.md` and items in `MVP_BUILD_SPEC.md`
- **Navigation structure** — note any nav bar, sidebar, tab bar, or breadcrumb visible; this defines the router structure in `LLD.md`
- **UI components** — identify specific MUI components implied by the layout (DataGrid, Card, Tabs, Drawer, DatePicker, etc.); reference these in `LLD.md` under the relevant page
- **Data displayed** — columns in tables, fields in forms, and labels on cards reveal the domain entities and their attributes; use these to strengthen `DATA_MODEL.md`
- **User roles implied by UI** — separate dashboards, admin panels, or role-specific screens indicate distinct personas; add them to `CUSTOMER_PERSONAS.md`
- **Flows visible in the images** — if the images show a multi-step form, modal, or approval sequence, document that flow in `HLD.md` under "Core flow"

If images conflict with or add to what is described in `ideas.md`, images take precedence for layout and scope — the author drew what they actually want.

### Step 2 — Review the example requirements

Read all files in `/requirements/example/` to understand the expected format, depth, and tone for each document. Use these as the structural model — not as content to copy. The content must come from the ideas for ${input:appName}.

### Step 3 — Create the requirements directory

Create the directory `/requirements/${input:appName}/` if it does not exist.

### Step 4 — Generate all 16 requirement documents

Write each of the following files to `/requirements/${input:appName}/`. Every document must be substantive and specific to ${input:appName} — not generic filler. Do not use placeholder text. If a topic is not covered in the idea, make reasonable inferences and note assumptions clearly.

---

### README.md
- App name and one-line description
- Repo name suggestion (kebab-case)
- List of all 16 documents with brief descriptions of what each covers

---

### EXECUTIVE_SUMMARY.md
- What the product is (2–3 sentences)
- The problem it solves
- Why now / market timing
- The solution summary
- Target market
- Commercial case summary
- Strategic value (acquisition/partnership angle if relevant)
- Bottom line

---

### PRD.md
- Product name and one-line pitch
- Problem statement (specific pain points as bullet list)
- ICP (Ideal Customer Profile)
- JTBD (Jobs To Be Done — 3–5 jobs)
- Existing alternatives and why they fall short
- The gap this product fills
- Core features (numbered list, 6–10 features)
- AI opportunities (if applicable)
- MVP feature set
- Success metrics

---

### PITCH.md
- A 4–6 paragraph investor/stakeholder pitch
- Cover: problem, solution, wedge, moat, market
- Written in plain direct language, not marketing copy

---

### HLD.md (High Level Design)
- Product stance (standalone SaaS, internal tool, platform feature, etc.)
- Identity model: Azure Entra app registration, OIDC for the React SPA, JWT bearer for the API
- Overview paragraph
- Primary users
- Core capabilities
- Runtime architecture: which services, how they connect (React SPA → Fastify API → MSSQL)
- Logical modules (numbered list matching feature areas)
- Core flow (numbered step-by-step walkthrough of the primary user journey)
- Scale characteristics
- Redis usage (caching/sessions, if applicable)
- Key risks and mitigations

---

### LLD.md (Low Level Design)
- Product separation (how it is isolated from other services)
- Local development model: devcontainer + Docker Compose (SQL Server, db-init, Flyway, app containers)
- Required top-level repo layout (show the `backend/`, `db/`, `frontend/`, `helm/` structure)
- Devcontainer services: MSSQL, db-init script, Flyway, backend, frontend
- Identity design:
  - SPA: Entra OIDC via `framework-react-core` (MSAL)
  - API: JWT Bearer validation (`iss`, `aud`, `exp`, `alg: RS256`)
  - Suggest RBAC table design if role-based access is needed
- Domain entities (the core data objects — will become DB tables)
- API route suggestions (list `METHOD /api/v1/ResourceName` for each CRUD operation)
- Worker flows (if applicable — numbered steps)
- Database standard: Flyway migrations in `db/migrations/`, naming convention `V{n}__{desc}.sql`
- `/db` directory structure suggestion
- Local DB workflow: `docker compose run flyway migrate`
- Infrastructure notes (Azure Blob, Redis, AKS namespaces, etc.)

---

### SYSTEM_ARCHITECTURE.md
- Architectural layers (numbered: presentation → API → business logic → data)
- Core principles / architectural decisions
- Component relationship diagram (text representation)
- Data flow between layers
- External integrations (Entra, Azure services, third-party APIs)

---

### DATA_MODEL.md
- Core entities (bulleted list with brief descriptions and key fields)
- Key relationships between entities (with cardinality)
- Important indexes or constraints to call out
- Any multi-tenancy considerations (tenant isolation strategy)
- Notes on any particularly complex domain rules embedded in the data model

---

### MVP_BUILD_SPEC.md
- MVP goal (one paragraph — what does "done" look like?)
- Stack components used (list from the tech stack above that apply)
- MVP workflows (numbered list of user journeys that must work at launch)
- What is explicitly OUT of MVP scope
- Guardrails (quality, legal, technical constraints)

---

### COMPETITIVE_ANALYSIS.md
- Category map (who else plays in this space)
- Vendor-by-vendor comparison (Strength / Weakness / Gap to exploit per vendor)
- Opportunity summary

---

### CUSTOMER_PERSONAS.md
- 3–5 personas, each with:
  - Name / role title
  - Core motivation
  - Primary pain point
  - How this product helps them

---

### ROADMAP.md
- Phase 1 — MVP (must align with MVP_BUILD_SPEC)
- Phase 2 — post-MVP expansion
- Phase 3 — scale features
- Future phases (stretch features)

---

### LANDING_PAGE.md
- Headline
- Subhead
- 4–6 key benefit bullets
- Primary CTA
- Optional: secondary CTA, social proof placeholder

---

### GO_TO_MARKET.md
- Best first channel(s)
- Wedge offer
- Sales motion (PLG vs high-touch vs channel)
- Messaging priorities
- Key partnerships or integrations that accelerate distribution

---

### PRICING_AND_POSITIONING.md
- Positioning statement
- Buyer profile
- Pricing concept (tiers with indicative ranges)
- Why they buy (value drivers)
- Risks

---

### MARKET_PRIORITIZATION.md
- Scorecard (rate each dimension 1–10):
  - Market size
  - Ease of build
  - Speed to revenue
  - Urgency of pain
  - Buyer clarity
  - Trust/compliance burden
- Summary paragraph
- Why it can win
- Why it's harder

---

### Step 5 — Confirm completion

After writing all 16 files, output a brief summary listing the files created and any assumptions made where the idea did not provide enough detail.
