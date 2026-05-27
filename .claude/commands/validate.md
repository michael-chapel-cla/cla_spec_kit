Read `.github/prompts/validate.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

**Input:**
- `repos/web-api-$ARGUMENTS/`
- `repos/web-$ARGUMENTS/`
- `repos/db-$ARGUMENTS/`

**Output:** A scored compliance report printed to the conversation (no files written). Score is 0–100 with findings grouped by category: Security, Code Quality, API Standards, DB Migrations, Docker Compose, Frontend, Framework Compliance, Testing, Accessibility.

**Path guardrail:** Repos are flat in `repos/` — if the repos are found at `repos/$ARGUMENTS/web-api-$ARGUMENTS/` instead, note this as a CRITICAL structural error before proceeding with the audit.
