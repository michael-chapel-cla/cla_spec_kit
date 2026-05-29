Read `.github/prompts/convert.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

**Input:** `lovable-conversions/$ARGUMENTS/` — the exported Lovable project source (must exist before running this command)

**Output — plan + three repos:**
- `plans/$ARGUMENTS/PLAN.md`            ← generated directly from source (no requirements documents)
- `repos/web-api-$ARGUMENTS/`           ← Fastify API repo
- `repos/web-$ARGUMENTS/`              ← React SPA repo
- `repos/db-$ARGUMENTS/`               ← Flyway migrations repo

**Pipeline:** source analysis → PLAN.md → scaffold → developer guides. No `/design` or `/plan` step needed.

**Format guardrails:**
- Do not carry over Lovable's tech choices — no Tailwind, no shadcn, no Supabase client, no JWT validation in source files
- Auth model: API reads APIM-forwarded headers (`x-user-id`, `x-user-email`, `x-user-roles`) — never import a token library
- TDD contract lives in the `TDD Contract` section of `PLAN.md` — there is no `requirements/TDD.md`; use PLAN.md as the test source of truth
- Deferred Lovable features (Supabase Realtime, Storage) go into Build Phase 2 — do not silently drop them
- All repo paths are flat in `repos/`: `repos/web-api-$ARGUMENTS/` — never nested under a subfolder
- `.env.example` must include `NPM_TOKEN=` (empty, with comment) alongside the DB variables
- No hardcoded secrets, no `console.log`, no TypeScript `any`
- CI/CD uses `.github/workflows/ci.yml` — never `azure-pipelines.yml`
- Every generated `.github/copilot-instructions.md` must be app-specific
