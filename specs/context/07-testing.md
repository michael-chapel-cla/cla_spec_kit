# Testing Audit Rules

> Load this file before auditing test coverage and test quality. Rules apply to both `web-api-<app>/` (Vitest + Node) and `web-<app>/` (Vitest + React Testing Library).

---

## Quick Reference — All Rules

| #   | Rule                                                              | Severity | Source     |
| --- | ----------------------------------------------------------------- | -------- | ---------- |
| T01 | Service class has no unit test file                               | HIGH     | Coverage   |
| T02 | Route plugin has no test file                                     | HIGH     | Coverage   |
| T03 | `test.only` or `describe.only` left in committed code             | HIGH     | CI         |
| T04 | `test.skip` with no linked issue comment explaining why           | MEDIUM   | Quality    |
| T05 | Unit test mocks the class under test (testing the mock, not code) | HIGH     | Quality    |
| T06 | DB client mocked to always return success — no unhappy-path tests | MEDIUM   | Quality    |
| T07 | Integration test mocks `mssql` entirely                           | CRITICAL | DB         |
| T08 | React component tested with Enzyme instead of RTL                 | HIGH     | Frontend   |
| T09 | `data-testid` not used for test selectors — using className/DOM structure | MEDIUM | Frontend |
| T10 | Coverage thresholds not set in `vitest.config.ts`                 | HIGH     | Coverage   |
| T11 | Coverage below 85% branch/line per threshold config               | HIGH     | Coverage   |
| T12 | Test file naming does not follow convention                       | LOW      | Structure  |
| T13 | `vi.mock()` hoisted above imports — breaks module resolution      | MEDIUM   | Vitest     |
| T14 | Assertions missing — test body has no `expect()` call             | HIGH     | Quality    |
| T15 | Snapshot tests used for dynamic/frequently-changing UI            | MEDIUM   | Quality    |

---

## T01 / T02 — Every Service and Route Must Have a Test File

**Severity**: HIGH

For every file at `src/features/<feature>/v1/<feature>.service.ts` there must be a corresponding `tests/unit/<feature>.service.test.ts`. For every `.routes.ts` there must be a `tests/unit/<feature>.routes.test.ts` (or `tests/integration/`).

### Detect

```bash
# List service files with no matching test file
for f in $(find src/features -name '*.service.ts'); do
  feature=$(basename "$f" .service.ts)
  test_path="tests/unit/${feature}.service.test.ts"
  [ ! -f "$test_path" ] && echo "MISSING TEST: $test_path"
done

# Same for routes
for f in $(find src/features -name '*.routes.ts'); do
  feature=$(basename "$f" .routes.ts)
  test_path="tests/unit/${feature}.routes.test.ts"
  [ ! -f "$test_path" ] && echo "MISSING TEST: $test_path"
done
```

### ✅ Minimum test structure — service

```typescript
// tests/unit/expenses.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpensesService } from '../../src/features/expenses/v1/expenses.service';

describe('ExpensesService', () => {
  let db: ReturnType<typeof mockDb>;
  let service: ExpensesService;

  beforeEach(() => {
    db = mockDb();
    service = new ExpensesService(db);
  });

  it('returns expenses for a tenant', async () => {
    db.executeQuery.mockResolvedValueOnce([{ Id: 1, Amount: 100 }]);
    const result = await service.listExpenses(1, 1);
    expect(result).toHaveLength(1);
    expect(result[0].Id).toBe(1);
  });

  it('returns empty array when no expenses found', async () => {
    db.executeQuery.mockResolvedValueOnce([]);
    const result = await service.listExpenses(1, 1);
    expect(result).toEqual([]);
  });

  it('propagates DB errors', async () => {
    db.executeQuery.mockRejectedValueOnce(new Error('DB connection lost'));
    await expect(service.listExpenses(1, 1)).rejects.toThrow('DB connection lost');
  });
});
```

---

## T03 — No `.only` in Committed Tests

**Severity**: HIGH | **Impact**: Silently skips all other tests in CI; a pipeline "passes" while most tests do not run.

### Detect

```bash
grep -rn '\.only(' tests/ test/ --include='*.test.ts' --include='*.test.tsx'
grep -rn 'test\.only\|it\.only\|describe\.only' tests/ test/ --include='*.ts' --include='*.tsx'
```

### ❌ NEVER (commit this)

```typescript
describe.only('ExpensesService', () => { ... }); // all other suites skipped
it.only('returns 200', () => { ... });
```

### ✅ ALWAYS

Remove `.only` before committing. Use `npx vitest run --reporter=verbose <specific-file>` locally to focus a single file during development.

---

## T04 — Skipped Tests Must Reference an Issue

**Severity**: MEDIUM

A skipped test with no explanation silently drops coverage with no way to track when it will be fixed.

### ❌ NEVER

```typescript
it.skip('handles concurrent requests', () => { ... });
```

### ✅ ALWAYS

```typescript
// TODO: re-enable when race condition in DB pool is resolved — GH #412
it.skip('handles concurrent requests', () => { ... });
```

---

## T05 — Do Not Mock the Class Under Test

**Severity**: HIGH

Mocking the service inside the service's own unit test means you are testing the mock, not the code.

### ❌ NEVER

```typescript
vi.mock('../../src/features/expenses/v1/expenses.service');
// Now every method returns undefined — the test proves nothing
```

### ✅ ALWAYS

Mock only **dependencies** of the class under test (typically the `DbClient`). The class itself must be instantiated with real code.

```typescript
const mockDb = () => ({ executeQuery: vi.fn() });
const service = new ExpensesService(mockDb()); // real class, mocked dependency
```

---

## T06 — Test Unhappy Paths

**Severity**: MEDIUM

A test suite that only mocks the DB returning success data does not verify error handling, empty results, or constraint violations.

### Required test cases per service method

1. **Happy path** — returns expected data
2. **Not found / empty** — DB returns `[]` or `null`; verify the service returns the correct shape (empty array, null, thrown 404)
3. **DB error** — DB rejects; verify the service propagates or transforms the error correctly

```typescript
it('throws 404 when expense not found', async () => {
  db.executeQuery.mockResolvedValueOnce([]); // empty result
  await expect(service.getExpense(1, 999)).rejects.toMatchObject({ statusCode: 404 });
});

it('propagates unexpected DB errors', async () => {
  db.executeQuery.mockRejectedValueOnce(new Error('timeout'));
  await expect(service.getExpense(1, 1)).rejects.toThrow('timeout');
});
```

---

## T07 — Integration Tests Must Not Mock `mssql`

**Severity**: CRITICAL

Mocking the `mssql` library in integration tests makes them worthless for catching query bugs, migration regressions, or schema mismatches. Integration tests must run against a real SQL Server instance (the local dev Docker Compose DB is acceptable).

### Detect

```bash
grep -rn "vi\.mock.*mssql\|jest\.mock.*mssql" tests/ --include='*.test.ts'
```

### ❌ NEVER (in integration tests)

```typescript
vi.mock('mssql', () => ({ connect: vi.fn(), query: vi.fn() }));
```

### ✅ ALWAYS

Use the same `DbClient` the application uses, pointed at the test database. Seed data in `beforeEach`; clean up in `afterEach`.

```typescript
// tests/integration/expenses.integration.test.ts
import { createDbClient } from '../../src/shared/db';

const db = createDbClient(process.env.TEST_DB_URL!);

beforeEach(async () => {
  await db.executeQuery('DELETE FROM dbo.Expenses WHERE TenantId = @tid', { tid: TEST_TENANT_ID });
});
```

---

## T08 — React Components Must Use React Testing Library

**Severity**: HIGH

Enzyme is not maintained for React 18, produces false positives on internal implementation details, and is not compatible with concurrent mode. All frontend tests must use `@testing-library/react`.

### Detect

```bash
grep -rn 'from.*enzyme\|require.*enzyme\|shallow(\|mount(' test/ --include='*.tsx' --include='*.ts'
```

### ✅ ALWAYS

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

it('renders the expense list', async () => {
  render(<MemoryRouter><ExpenseList /></MemoryRouter>);
  expect(await screen.findByText('Q1 Expenses')).toBeInTheDocument();
});

it('shows empty state when no expenses', () => {
  render(<MemoryRouter><ExpenseList /></MemoryRouter>);
  expect(screen.getByText('No expenses found.')).toBeInTheDocument();
});
```

---

## T09 — Use `data-testid` for Test Selectors

**Severity**: MEDIUM

Selecting elements by className or DOM structure couples tests to implementation details. A CSS refactor should not break a behaviour test.

### ❌ NEVER

```typescript
const button = container.querySelector('.MuiButton-root'); // breaks on MUI version bump
const row = wrapper.find('tr').at(2); // breaks if table order changes
```

### ✅ ALWAYS

```tsx
// In the component
<Button data-testid="submit-expense-btn" onClick={handleSubmit}>Submit</Button>

// In the test
const button = screen.getByTestId('submit-expense-btn');
fireEvent.click(button);
```

---

## T10 / T11 — Coverage Thresholds Must Be Configured and Met

**Severity**: HIGH

Without enforced thresholds, coverage can silently drop to 0% while CI still passes.

### Detect

```bash
# Check for threshold config
grep -n 'thresholds\|branches\|lines\|functions\|statements' vitest.config.ts
```

### ✅ Required `vitest.config.ts` shape

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 85,
        lines: 85,
        functions: 85,
        statements: 85,
      },
      exclude: ['src/shared/db.ts', 'src/index.ts', '**/*.types.ts', '**/*.schema.ts'],
    },
  },
});
```

Flag as HIGH if `thresholds` is absent from the config. Flag as HIGH if the actual coverage report (from `npm run test:coverage`) shows any metric below 85%.

---

## T12 — Test File Naming Convention

**Severity**: LOW

| File type         | Convention                            | Location                          |
| ----------------- | ------------------------------------- | --------------------------------- |
| Service unit test | `<feature>.service.test.ts`           | `tests/unit/`                     |
| Route unit test   | `<feature>.routes.test.ts`            | `tests/unit/`                     |
| Integration test  | `<feature>.integration.test.ts`       | `tests/integration/`              |
| React page test   | `<PageName>.test.tsx`                 | `test/unit/`                      |
| React hook test   | `use<HookName>.test.ts`               | `test/unit/`                      |

### Detect

```bash
# Files not matching convention
find tests/ -name '*.test.ts' | grep -v 'service\.test\|routes\.test\|integration\.test'
find test/ -name '*.test.tsx' | grep -v '\.test\.tsx$'
```

---

## T13 — `vi.mock()` Hoisting

**Severity**: MEDIUM

Vitest hoists `vi.mock()` calls to the top of the file at compile time. If you reference a variable defined in the test file inside the factory, it will be `undefined` at hoist time.

### ❌ NEVER

```typescript
const DB_MOCK = { executeQuery: vi.fn() };
vi.mock('../../src/shared/db', () => DB_MOCK); // DB_MOCK is undefined at hoist time
```

### ✅ ALWAYS

```typescript
vi.mock('../../src/shared/db', () => ({
  createDbClient: () => ({ executeQuery: vi.fn() }), // factory must be self-contained
}));
```

---

## T14 — Every Test Must Have at Least One Assertion

**Severity**: HIGH

A test with no `expect()` passes vacuously — it proves nothing.

### Detect

```bash
# Find test blocks with no expect
grep -rn '^  it(' tests/ test/ --include='*.ts' --include='*.tsx' -A 10 | grep -v 'expect(' | grep '^  });'
```

### ❌ NEVER

```typescript
it('creates an expense', async () => {
  await service.createExpense({ amount: 100, tenantId: 1 });
  // no expect — test always passes
});
```

### ✅ ALWAYS

```typescript
it('creates an expense and returns the new ID', async () => {
  db.executeQuery.mockResolvedValueOnce([{ Id: 42 }]);
  const result = await service.createExpense({ amount: 100, tenantId: 1 });
  expect(result.Id).toBe(42); // ✅ at least one assertion
});
```

---

## T15 — Avoid Snapshots for Dynamic UI

**Severity**: MEDIUM

Snapshot tests for data-driven components (tables, lists, dashboards) break on every data change and become checkbox-driven maintenance burden rather than real regression detection.

### ❌ AVOID for dynamic content

```typescript
it('renders the expense table', () => {
  const { asFragment } = render(<ExpenseTable expenses={mockExpenses} />);
  expect(asFragment()).toMatchSnapshot(); // breaks any time mock data or markup changes
});
```

### ✅ PREFER behaviour assertions

```typescript
it('renders one row per expense', () => {
  render(<ExpenseTable expenses={[{ id: 1, amount: 100 }, { id: 2, amount: 200 }]} />);
  expect(screen.getAllByRole('row')).toHaveLength(3); // 2 data rows + header
});
```

Snapshots are acceptable for static, layout-only components (e.g., an error boundary fallback UI) where the exact structure is the point.

---

## Audit Checklist

When auditing both `web-api-<app>/` and `web-<app>/`:

1. Every `.service.ts` file has a matching `.service.test.ts`
2. Every `.routes.ts` file has a matching `.routes.test.ts`
3. No `.only` calls in any test file
4. All `.skip` calls have an issue reference in a comment
5. `vitest.config.ts` has `thresholds` set to ≥ 85 for all four metrics
6. No `vi.mock('mssql')` in integration test files
7. No Enzyme imports in any frontend test file
8. All test blocks contain at least one `expect()` call
