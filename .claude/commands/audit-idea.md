Read `.github/prompts/audit-idea.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

Input: `ideas/$ARGUMENTS/ideas.md` and any other files in `ideas/$ARGUMENTS/`
Output: a scored audit report printed to the conversation with a READY / NEEDS WORK / BLOCKED verdict (no files written)
