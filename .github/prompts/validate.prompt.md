---
mode: agent
description: Audit a generated application against the organization's coding standards and produce a scored compliance report.
tools:
  - codebase
  - findFiles
---

Audit **${input:appName}** against the organization's coding standards and produce a scored compliance report.

---

## WORKFLOW

### Step 1 — Read the application

Read the following to understand what was built:
- All TypeScript files under `/repos/web-api-${input:appName}/src/`
- All SQL files under `/repos/db-${input:appName}/migrations/`
- `/repos/web-api-${input:appName}/docs/openapi.yaml`
- `/repos/web-api-${input:appName}/.env.example`
- `/repos/web-api-${input:appName}/docker-compose.yml`
- `/repos/db-${input:appName}/docker-compose.yml`
- `/repos/web-${input:appName}/docker-compose.yml` (if present)
- All TypeScript files under `/repos/web-${input:appName}/src/`

---

### Step 2 — Load the audit rules

Read all eight audit context files:
- `/specs/context/01-security.md`
- `/specs/context/02-code-quality.md`
- `/specs/context/03-api-standards.md`
- `/specs/context/04-db-migrations.md`
- `/specs/context/05-frontend.md`
- `/specs/context/06-framework.md`
- `/specs/context/07-testing.md`
- `/specs/context/08-accessibility.md`

---

### Step 3 — Run the audits

Score each finding using this scale:

| Severity | Deduction |
|---|---|
| CRITICAL | -25 |
| HIGH | -15 |
| MEDIUM | -7 |
| LOW | -3 |
| INFO | 0 |

Starting score: **100**. Minimum: **0**.

Run audits in this order, checking the relevant files for every rule in the loaded context files:

**Security audit** (01-security.md) — scan `web-api-${input:appName}/src/`, `db-${input:appName}/migrations/`, and `web-api-${input:appName}/.env.example`:
- Hardcoded secrets (S03, S09)
- SQL string concatenation (S04)
- JWT verification missing algorithm, issuer, or audience (S07, S13)
- Wildcard CORS (S15)
- Missing rate limiting (S16)
- Missing security headers (S18)
- Sensitive data in logs (S19)
- Stack traces in error responses (S12)
- All other rules in 01-security.md

**Code quality audit** (02-code-quality.md) — scan all TypeScript files in `web-api-${input:appName}/src/` and `web-${input:appName}/src/`:
- TypeScript `any` usage (Q01)
- `console.log` in production code (Q03)
- `.then()/.catch()` chains instead of async/await (Q05)
- Direct API calls inside React components (Q11)
- `useEffect` missing dependencies (Q12)
- All other rules in 02-code-quality.md

**API standards audit** (03-api-standards.md) — scan `web-api-${input:appName}/src/features/`, `web-api-${input:appName}/docs/openapi.yaml`, and `web-api-${input:appName}/postman/`:
- Missing or incomplete openapi.yaml (A01, A02)
- Missing URI versioning (A03)
- Verbs in URL paths (A04)
- Resource names not PascalCase plural (A05)
- Wrong HTTP methods (A06)
- POST not returning 201 + Location (A07)
- Missing feature-based directory structure (A25)
- Missing Postman collection (A26)
- All other rules in 03-api-standards.md

**DB migrations audit** (04-db-migrations.md) — scan all `.sql` files in `db-${input:appName}/migrations/`:
- Naming convention violations (D01)
- Duplicate version numbers (D02)
- `SELECT *` in migrations (D05)
- Missing transactions on data migrations (D06)
- `flyway.conf` committed with credentials (D09)
- All other rules in 04-db-migrations.md

**Frontend audit** (05-frontend.md) — scan all TypeScript/TSX files in `web-${input:appName}/src/`:
- Direct API calls inside React components instead of service layer (F01)
- `useEffect` missing dependency arrays or incorrect deps (F02)
- Timers/subscriptions not cleaned up in useEffect (F03)
- Array index used as React list key (F04)
- Hardcoded `clientId`, `authority`, or scope URI literals in source (F05)
- Protected routes missing `loader: requireAuth()` (F06)
- Auth logic reimplemented instead of using `framework-react-core` (F07)
- `RouterProvider` not wrapped in `ThemeProvider` with `claTheme` (F08)
- `static-config.json` missing required fields (F09)
- All other rules in 05-frontend.md

**Docker Compose audit** — scan `web-api-${input:appName}/docker-compose.yml`, `db-${input:appName}/docker-compose.yml`, and `web-${input:appName}/docker-compose.yml` (if present):
- Flyway mount in `web-api-*/docker-compose.yml` points to `../db-${input:appName}/migrations` not `./migrations` — a wrong path silently runs stale migrations (DC01, CRITICAL)
- No hardcoded passwords or secrets in any compose file — all sensitive values must use `${VAR}` substitution syntax (DC02, CRITICAL)
- MSSQL service has a `healthcheck` block (DC03, HIGH)
- Flyway service has `depends_on` with `condition: service_healthy` on the db service (DC04, HIGH)
- Each repo's compose file only defines the services relevant to that repo — db compose should not start the API, api compose should not start the frontend (DC05, MEDIUM)
- No `trustServerCertificate=true` in Flyway JDBC URL in production-targeted compose files (DC06, MEDIUM — acceptable in `docker-compose.override.yml` or dev-only files)

**Testing audit** (07-testing.md) — scan `web-api-${input:appName}/tests/`, `web-${input:appName}/test/`, and all `vitest.config.ts` files:
- Every `.service.ts` has a corresponding `.service.test.ts` (T01)
- Every `.routes.ts` has a corresponding `.routes.test.ts` (T02)
- No `test.only` or `describe.only` in committed test files (T03)
- No `vi.mock('mssql')` in integration tests (T07)
- `vitest.config.ts` has coverage thresholds set to ≥ 85 for all four metrics (T10)
- All test blocks contain at least one `expect()` call (T14)
- All other rules in 07-testing.md

**Accessibility audit** (08-accessibility.md) — scan all `.tsx` files in `web-${input:appName}/src/`:
- `<div onClick>` or `<span onClick>` without `role` and `tabIndex={0}` (AX01)
- `<img>` missing `alt` attribute (AX02)
- MUI `TextField`, `Select`, `Checkbox` missing `label` prop (AX03)
- `<IconButton>` missing `aria-label` (AX04)
- Error messages not using MUI `helperText` + `error` props (AX05)
- Status indicators using color alone with no icon or text (AX06)
- MUI `Dialog` missing `aria-labelledby` (AX09)
- MUI `Tab` missing `id` and `aria-controls`; TabPanel missing `aria-labelledby` (AX10)
- DataGrid column definitions missing `headerName` (AX11)
- `outline: none` with no `focus-visible` replacement (AX14)
- All other rules in 08-accessibility.md

**Framework compliance audit** (06-framework.md) — scan `web-api-${input:appName}/src/app.ts`, all route files, `web-${input:appName}/src/App.tsx`, `web-${input:appName}/src/router.tsx`, and all `eslint.config.*` files:
- App created without `FrameworkFastify.create()` (W01)
- Config not initialised with `framework.initAppConfig()` (W02)
- `useEnvironmentVariables` not `true` (W03)
- Route plugin not registered with `prefix` (W04)
- Route plugin signature missing `{ db }` in options (W05)
- `framework.start()` not called or called before plugins registered (W06)
- Admin routes using bare `authMiddleware` instead of `requireScope()` (W07)
- Protected routes missing `loader: requireAuth()` (W08)
- Auth logic reimplemented instead of `framework-react-core` (W09)
- `RouterProvider` outside `ThemeProvider` with `claTheme` (W10)
- `claTheme`/`claDarkTheme` not imported from `lib-seamlesscomponents-react` (W11)
- ESLint config not extending `framework-eslint-config` (W12)
- All other rules in 06-framework.md

---

### Step 4 — Output the report

Format the report exactly as shown below:

---

## Audit Report: ${input:appName}

**Final Score: XX/100**
**Status: PASS / REVIEW / FAIL**

> PASS = 90+  |  REVIEW = 70–89 (fix HIGH/CRITICAL before merge)  |  FAIL = <70 (must fix CRITICAL and HIGH)

### Security

| Severity | Rule | File | Finding |
|---|---|---|---|
| CRITICAL | S04 | `web-api-.../src/features/users/v1/users.service.ts:42` | SQL string concatenation in `getUser()` |

*(If no findings: "No issues found.")*

### Code Quality

| Severity | Rule | File | Finding |
|---|---|---|---|

### API Standards

| Severity | Rule | File | Finding |
|---|---|---|---|

### DB Migrations

| Severity | Rule | File | Finding |
|---|---|---|---|

### Docker Compose

| Severity | Rule | File | Finding |
|---|---|---|---|

### Frontend

| Severity | Rule | File | Finding |
|---|---|---|---|

### Framework Compliance

| Severity | Rule | File | Finding |
|---|---|---|---|

### Testing

| Severity | Rule | File | Finding |
|---|---|---|---|

### Accessibility

| Severity | Rule | File | Finding |
|---|---|---|---|

### Summary

| Category | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Security | 0 | 0 | 0 | 0 |
| Code Quality | 0 | 0 | 0 | 0 |
| API Standards | 0 | 0 | 0 | 0 |
| DB Migrations | 0 | 0 | 0 | 0 |
| Docker Compose | 0 | 0 | 0 | 0 |
| Frontend | 0 | 0 | 0 | 0 |
| Framework Compliance | 0 | 0 | 0 | 0 |
| Testing | 0 | 0 | 0 | 0 |
| Accessibility | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** |

**Score breakdown**: started 100 — deducted X for [list findings] = **XX/100**

### Recommended fixes (CRITICAL and HIGH only)

List each CRITICAL and HIGH finding with the specific change needed to resolve it.
