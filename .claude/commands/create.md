Read `.github/prompts/create.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

**Input:** `plans/$ARGUMENTS/PLAN.md` (run `/plan $ARGUMENTS` first)

**Output — three repos written to `repos/` (flat, not nested):**
- `repos/web-api-$ARGUMENTS/`   ← Fastify API repo
- `repos/web-$ARGUMENTS/`       ← React SPA repo
- `repos/db-$ARGUMENTS/`        ← Flyway migrations repo

**Path guardrail — this is the most common mistake:**
- `repos/web-api-$ARGUMENTS/`             ✅ CORRECT
- `repos/$ARGUMENTS/web-api-$ARGUMENTS/`  ❌ NEVER — no subfolder between repos/ and the repo name

**Format guardrails:**
- Copy templates first, then customize — never generate files from scratch
- No hardcoded secrets anywhere (Entra clientId/secret, DB passwords, JWT secrets as literals)
- All SQL uses parameterized queries — never string concatenation
- No `azure-pipelines.yml` — CI/CD uses `.github/workflows/ci.yml`
- No "For Hermes" or agent-specific meta-instructions in any generated file
- Every generated `.github/copilot-instructions.md` must be app-specific (not a copy of the spec-kit's own instructions)

After scaffolding all three repos, execute the docs prompt to generate `DEVELOPER_GUIDE.md` in each repo (Step 10 of `create.prompt.md`).
