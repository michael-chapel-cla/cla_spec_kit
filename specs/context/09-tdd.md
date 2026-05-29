# TDD Guardrails

> Load this file before scaffolding or auditing any application. These rules enforce test-first development: test files must be written before (or alongside) the business logic they cover. An implementation file with no corresponding test file is a TDD violation, not a missing test.

---

## Core Principle

Test files define the contract. Implementation files fulfill it. The order is non-negotiable:

1. Write the test file with named `it()` blocks derived from the TDD.md requirement document
2. Write the implementation to make those tests pass
3. Never write an implementation file first

---

## Quick Reference — All Rules

| #   | Rule                                                                 | Severity | Phase     |
| --- | -------------------------------------------------------------------- | -------- | --------- |
| TD01 | Implementation file exists but corresponding test file does not     | CRITICAL | Scaffold  |
| TD02 | Test file exists but contains no meaningful `it()` blocks           | HIGH     | Scaffold  |
| TD03 | Test cases do not match the contracts specified in `TDD.md`         | HIGH     | Scaffold  |
| TD04 | Service test covers only happy path — no error or edge case tests   | HIGH     | Quality   |
| TD05 | Route test covers only 200/201 — no 401, 403, 404, or 422 cases    | HIGH     | Quality   |
| TD06 | Frontend test has no render assertion, interaction test, or state test | MEDIUM | Quality   |
| TD07 | Test file uses `// TODO` placeholders with no `expect()` calls      | HIGH     | Quality   |
| TD08 | Coverage thresholds not enforced in `vitest.config.ts`              | HIGH     | Config    |

---

## TD01 — Test File Must Exist Before Implementation Is Complete

Every implementation file at any of these paths must have a corresponding test file before the feature is considered scaffolded:

| Implementation file | Required test file |
|---|---|
| `src/features/<f>/v1/<f>.service.ts` | `tests/unit/<f>.service.test.ts` |
| `src/features/<f>/v1/<f>.routes.ts` | `tests/unit/<f>.routes.test.ts` |
| `src/pages/<P>/<P>.tsx` | `test/unit/<P>.test.tsx` |

The test file must be written **first** during scaffolding. If `/create` writes `expenses.service.ts` without a pre-existing `expenses.service.test.ts`, that is a TD01 violation.

---

## TD02 / TD03 — Test Files Must Have Named, Contract-Derived Test Cases

Test stubs must contain the specific `it()` descriptions from `TDD.md`. A test file with only `it('is instantiated correctly', ...)` or empty `describe` blocks does not satisfy TDD.

### ❌ NEVER — empty or trivial stub only

```typescript
describe('ExpensesService', () => {
  it('is instantiated correctly', () => {
    expect(service).toBeDefined();
  });
  // TODO: add assertions
});
```

### ✅ ALWAYS — contract-derived test cases from TDD.md

```typescript
describe('ExpensesService', () => {
  describe('listExpenses(tenantId, page, limit)', () => {
    it('returns paginated expenses for a valid tenant', async () => {
      db.executeQuery.mockResolvedValueOnce([{ Id: 1, Amount: 100 }]);
      const result = await service.listExpenses(1, 1, 10);
      expect(result).toHaveLength(1);
      expect(result[0].Id).toBe(1);
    });

    it('returns empty array when tenant has no expenses', async () => {
      db.executeQuery.mockResolvedValueOnce([]);
      const result = await service.listExpenses(1, 1, 10);
      expect(result).toEqual([]);
    });

    it('throws 404 when tenant does not exist', async () => {
      db.executeQuery.mockResolvedValueOnce([]);
      await expect(service.listExpenses(999, 1, 10)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('propagates unexpected DB errors', async () => {
      db.executeQuery.mockRejectedValueOnce(new Error('connection lost'));
      await expect(service.listExpenses(1, 1, 10)).rejects.toThrow('connection lost');
    });
  });
});
```

---

## TD04 — Service Tests Must Cover All Three Case Types

For every public service method, the test suite must include:

1. **Happy path** — returns expected data for valid inputs
2. **Not found / empty** — DB returns `[]` or `null`; service returns correct shape or throws 404
3. **Error path** — DB rejects; service propagates or transforms correctly

A service test that only has happy-path cases is a TD04 violation regardless of how many `it()` blocks it contains.

---

## TD05 — Route Tests Must Cover Auth and Validation Failures

For every API route test, the suite must include:

| Case | Required test |
|---|---|
| Happy path | 200/201/204 with correct shape |
| Missing auth | 401 when `Authorization` header absent |
| Invalid/expired token | 401 when token is malformed or expired |
| Scope / role missing | 403 when authenticated but not authorized |
| Not found | 404 when resource does not exist |
| Validation failure | 422 when required fields are missing or invalid |

```typescript
describe('GET /api/v1/Expenses', () => {
  it('returns 200 with expense list for authenticated user', async () => { ... });
  it('returns 401 when Authorization header is missing', async () => { ... });
  it('returns 401 when token is expired', async () => { ... });
  it('returns 403 when user lacks the required scope', async () => { ... });
});

describe('POST /api/v1/Expenses', () => {
  it('returns 201 with Location header when body is valid', async () => { ... });
  it('returns 422 when required field "amount" is missing', async () => { ... });
  it('returns 401 when not authenticated', async () => { ... });
});
```

---

## TD06 — Frontend Tests Must Cover Render, Interaction, and State

For every page component, the test suite must include at minimum:

1. **Render** — key elements appear on screen after mount
2. **Loading state** — loading indicator shown while data is in flight
3. **Empty state** — correct message shown when the data list is empty
4. **Error state** — error message shown when the API call fails
5. **Interaction** — at least one user action (click, submit) with its expected outcome

```typescript
describe('ExpenseList', () => {
  it('shows loading indicator while expenses are fetching', () => { ... });
  it('renders expense rows after successful fetch', async () => { ... });
  it('shows empty state when no expenses exist', async () => { ... });
  it('shows error message when fetch fails', async () => { ... });
  it('opens the create dialog when "Add Expense" is clicked', async () => { ... });
});
```

---

## TD07 — No `// TODO` Placeholders as the Only Test Content

A test file that ships with only `// TODO: add assertions` comments provides no contract and no regression protection. The `it()` descriptions and `expect()` calls must be present at scaffolding time, derived from `TDD.md`.

The only acceptable use of `// TODO` in a test file is to mark a known edge case that requires real DB state not available in unit tests — and it must have a linked issue comment.

---

## TD08 — Coverage Thresholds

`vitest.config.ts` in every repo must enforce:

```typescript
coverage: {
  thresholds: {
    branches:   80,
    lines:      85,
    functions:  85,
    statements: 85,
  },
}
```

These thresholds are the floor, not the target. TDD-first development should exceed them comfortably.

---

## TDD.md Document Structure (Reference)

The `TDD.md` requirement document generated by `/design` must follow this structure. `/create` reads this document and writes test files from it before writing any implementation.

```markdown
# TDD.md — Test Contract for <App Name>

## Overview
Brief description of test strategy: which layers have unit tests, which have integration tests, coverage targets.

## [Feature Name] Feature

### [FeatureName]Service — Unit Tests (`tests/unit/<feature>.service.test.ts`)

#### `methodName(param1, param2)`
- [happy path description]
- [not found / empty description]
- [validation error description]
- [DB error / propagation description]

### [FeatureName] Routes — Integration Tests (`tests/unit/<feature>.routes.test.ts`)

#### `GET /api/v1/Resources`
- 200 with [shape] for authenticated user
- 401 when Authorization header is missing
- 401 when token is expired
- 403 when user lacks [scope]

#### `POST /api/v1/Resources`
- 201 with Location header when body is valid
- 422 when [required field] is missing
- 409 when [duplicate condition]
- 401 when not authenticated

## [Page Name] Page — Frontend Tests (`test/unit/<PageName>.test.tsx`)

### Render
- [key element] is visible after mount
- loading indicator shown while data is fetching
- empty state message shown when list is empty
- error message shown when fetch fails

### Interactions
- [user action] triggers [expected outcome]
- [form submit] calls [service method] and [expected result]

### Accessibility
- all form fields have associated labels
- action buttons have accessible names
```
