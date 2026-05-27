Read `.github/prompts/audit-idea.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

**Input:** `ideas/$ARGUMENTS/ideas.md` and any other `.md` or image files in `ideas/$ARGUMENTS/`

**Output:** A scored audit report printed to the conversation with a READY / NEEDS WORK / BLOCKED verdict (no files written)

**Run this before `/design $ARGUMENTS`** to catch gaps in the idea file that would produce a weak requirements set.
