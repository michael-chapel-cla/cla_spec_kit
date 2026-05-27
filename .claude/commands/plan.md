Read `.github/prompts/plan.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

**Input:** `requirements/$ARGUMENTS/` (run `/design $ARGUMENTS` first)

**Output:** `plans/$ARGUMENTS/PLAN.md` — a single architecture reference document

**Format guardrails — the output must match `plans/expense-flow/PLAN.md` exactly:**

The PLAN.md is an **architecture reference document** consumed by `/create`. It is NOT a task execution plan for an agent.

✅ PLAN.md must contain:
- Overview section with repo names and output paths
- Architecture Decisions table (auth, DB, multi-tenancy, caching, etc.)
- Complete directory tree for all three repos showing every file
- API Endpoints section: every endpoint as a table with method, path, auth scope, request body, response shape, all status codes
- Database Schema section: every table with columns, types, indexes, FKs, and the exact Flyway migration filenames
- Frontend Pages section: every page with route, file path, MUI components, service calls
- Helm Configuration section
- Azure Entra Configuration section
- Environment Variables table
- Build Phases section (Phase 1 MVP as a numbered task list, Phase 2+)
- Local Development Setup (bash commands for initial setup only)

❌ PLAN.md must NOT contain:
- "For Hermes" or any agent-specific meta-instructions
- Actual SQL DDL code blocks
- Actual TypeScript code blocks
- Bash commands for git commits, file copies, or verification steps
- Task-by-task implementation instructions with Objective/Files/Code/Verification structure
- Repo paths nested under a subfolder (e.g. `repos/leave-manager/web-api-leave-manager/` is WRONG)

**Correct repo paths** — always flat in `repos/`:
- `repos/web-api-$ARGUMENTS/`   ✅
- `repos/web-$ARGUMENTS/`       ✅
- `repos/db-$ARGUMENTS/`        ✅
- `repos/$ARGUMENTS/web-api-$ARGUMENTS/`  ❌ NEVER

**CI/CD**: `.github/workflows/ci.yml` — never `azure-pipelines.yml`
