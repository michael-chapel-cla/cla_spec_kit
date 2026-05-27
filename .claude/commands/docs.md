Read `.github/prompts/docs.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

**Input:**
- `plans/$ARGUMENTS/PLAN.md`
- `repos/web-api-$ARGUMENTS/.env.example`
- `repos/web-api-$ARGUMENTS/docs/openapi.yaml`
- `repos/web-api-$ARGUMENTS/src/features/` (to list implemented features)
- `repos/web-$ARGUMENTS/src/router.tsx` (to list pages)
- `repos/db-$ARGUMENTS/migrations/` (to summarize DB schema)

**Output — one file written per repo:**
- `repos/web-api-$ARGUMENTS/DEVELOPER_GUIDE.md`
- `repos/web-$ARGUMENTS/DEVELOPER_GUIDE.md`
- `repos/db-$ARGUMENTS/DEVELOPER_GUIDE.md`

Each guide is specific to $ARGUMENTS — covers local setup, env vars, how auth works, how to add a feature/page/migration. No generic filler.

**Path guardrail:** Repos are always flat in `repos/` — never nested under a subfolder.
