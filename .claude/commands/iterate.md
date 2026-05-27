Read `.github/prompts/iterate.prompt.md` and execute every step it describes.

**Usage:** `/iterate <app-name> <feature-name>`

`$ARGUMENTS` contains both values separated by a space. Parse them: the first word is `appName`, everything after the first space is `featureName`.

**Input:**
- `plans/$1/PLAN.md`
- All existing files under `repos/web-api-$1/src/features/`
- `repos/web-api-$1/docs/openapi.yaml`
- All `.sql` files under `repos/db-$1/migrations/`
- `repos/web-$1/src/router.tsx`

**Output — files added to the existing repos (flat paths):**
- `repos/db-$1/migrations/V1.0.X__<feature>.sql`
- `repos/web-api-$1/src/features/<feature>/v1/` (4 files)
- `repos/web-api-$1/docs/openapi.yaml` (updated)
- `repos/web-api-$1/src/app.ts` (route plugin registered)
- `repos/web-$1/src/services/<feature>Api.ts`
- `repos/web-$1/src/types/<feature>.types.ts`
- `repos/web-$1/src/pages/<Feature>/<Feature>.tsx`
- `repos/web-$1/src/router.tsx` (route added)
- Test stubs in both repos

**Path guardrail:** Repos are always at `repos/web-api-$1/`, `repos/web-$1/`, `repos/db-$1/` — never nested under a subfolder.
