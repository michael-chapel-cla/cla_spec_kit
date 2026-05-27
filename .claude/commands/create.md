Read `.github/prompts/create.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

Input: `plans/$ARGUMENTS/PLAN.md` (run /plan first)
Output:
  `repos/web-api-$ARGUMENTS/`   — Fastify API repo
  `repos/web-$ARGUMENTS/`       — React SPA repo
  `repos/db-$ARGUMENTS/`        — Flyway migrations repo
