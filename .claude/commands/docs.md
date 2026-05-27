Read `.github/prompts/docs.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

Input: `plans/$ARGUMENTS/PLAN.md`, `repos/web-api-$ARGUMENTS/`, `repos/web-$ARGUMENTS/`, `repos/db-$ARGUMENTS/`
Output: `DEVELOPER_GUIDE.md` written into each of the three repos
