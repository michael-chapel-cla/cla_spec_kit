Read `.github/prompts/iterate.prompt.md` and execute every step it describes.

**Usage:** `/iterate <app-name> <feature-name>`

`$ARGUMENTS` contains both values separated by a space. Parse them: the first word is `appName`, the remainder is `featureName`.

Input: `repos/web-api-$1/`, `repos/web-$1/`, `repos/db-$1/`, `plans/$1/PLAN.md`
Output: new migration, feature files, OpenAPI additions, frontend page, test stubs — all written to the relevant repos
