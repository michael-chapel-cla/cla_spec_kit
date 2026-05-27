---
name: spec-kit-validate
description: Run /validate <app-name> — audit generated app against coding standards and produce scored compliance report
category: software-development
---

# Spec Kit — /validate Command

Run this when the user says "validate <app-name>" or "/validate <app-name>".

## Workflow

### Step 1 — Read the application
Read:
- All TypeScript files under `/repos/<app-name>/backend/src/`
- All SQL files under `/repos/<app-name>/db/migrations/`
- `/repos/<app-name>/backend/docs/openapi.yaml`
- `/repos/<app-name>/backend/.env.example`
- `/repos/<app-name>/docker-compose.yml`
- All TypeScript files under `/repos/<app-name>/frontend/src/`

### Step 2 — Load audit rules
Read all four context files:
- `/specs/context/01-security.md`
- `/specs/context/02-code-quality.md`
- `/specs/context/03-api-standards.md`
- `/specs/context/04-db-migrations.md`

### Step 3 — Run audits
Score each finding using this scale:

| Severity | Deduction |
|---|---|
| CRITICAL | -25 |
| HIGH | -15 |
| MEDIUM | -7 |
| LOW | -3 |
| INFO | 0 |

Starting score: **100**. Minimum: **0**.

Run audits in this order, checking relevant files for every rule in loaded context files:

**Security audit** (01-security.md) — scan all backend TypeScript, SQL files, config files, `.env.example`:
- Hardcoded secrets (S03, S09)
- SQL string concatenation (S04)
- JWT verification missing algorithm, issuer, or audience (S07, S13)
- Wildcard CORS (S15)
- Missing rate limiting (S16)
- Missing security headers (S18)
- Sensitive data in logs (S19)
- Stack traces in error responses (S12)
- All other rules in 01-security.md

**Code quality audit** (02-code-quality.md) — scan all TypeScript files:
- TypeScript `any` usage (Q01)
- `console.log` in production code (Q03)
- `.then()/.catch()` chains instead of async/await (Q05)
- Direct API calls inside React components (Q11)
- `useEffect` missing dependencies (Q12)
- All other rules in 02-code-quality.md

**API standards audit** (03-api-standards.md) — scan routes, openapi.yaml, error handlers:
- Missing or incomplete openapi.yaml (A01, A02)
- Missing URI versioning (A03)
- Verbs in URL paths (A04)
- Resource names not PascalCase plural (A05)
- Wrong HTTP methods (A06)
- POST not returning 201 + Location (A07)
- Missing feature-based directory structure (A25)
- Missing Postman collection (A26)
- All other rules in 03-api-standards.md

**DB migrations audit** (04-db-migrations.md) — scan all `.sql` files in `db/migrations/`:
- Naming convention violations (D01)
- Duplicate version numbers (D02)
- `SELECT *` in migrations (D05)
- Missing transactions on data migrations (D06)
- `flyway.conf` committed with credentials (D09)
- All other rules in 04-db-migrations.md

### Step 4 — Output report
Format exactly:

---

## Audit Report: <app-name>

**Final Score: XX/100**
**Status: PASS / REVIEW / FAIL**

> PASS = 90+ | REVIEW = 70–89 (fix HIGH/CRITICAL before merge) | FAIL = <70 (must fix CRITICAL and HIGH)

### Security

| Severity | Rule | File | Finding |
|---|---|---|---|
| CRITICAL | S04 | `backend/src/features/users/v1/users.service.ts:42` | SQL string concatenation in `getUser()` |

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

### Summary

| Category | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Security | 0 | 0 | 0 | 0 |
| Code Quality | 0 | 0 | 0 | 0 |
| API Standards | 0 | 0 | 0 | 0 |
| DB Migrations | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** |

**Score breakdown**: started 100 — deducted X for [list findings] = **XX/100**

### Recommended fixes (CRITICAL and HIGH only)

List each CRITICAL and HIGH finding with the specific change needed to resolve it.
