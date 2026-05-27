Read `.github/prompts/validate.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

Input: `repos/web-api-$ARGUMENTS/`, `repos/web-$ARGUMENTS/`, `repos/db-$ARGUMENTS/`
Output: a scored compliance report printed to the conversation (no files written)
