# Frontend Audit Rules

> Load this file before auditing the React SPA (`web-<app-name>/`). Rules cover component structure, hooks, auth, routing, API calls, and UI library usage.

---

## Quick Reference — All Rules

| #   | Rule                                                        | Severity | Source       |
| --- | ----------------------------------------------------------- | -------- | ------------ |
| F01 | Direct API call inside a React component                    | HIGH     | Architecture |
| F02 | `useEffect` with missing or incorrect dependency array      | HIGH     | Hooks        |
| F03 | `useEffect` with no cleanup for timers or subscriptions     | MEDIUM   | Hooks        |
| F04 | List items using array index as `key`                       | MEDIUM   | React        |
| F05 | Hardcoded Entra `clientId` or `authority` in source code    | CRITICAL | Auth         |
| F06 | Protected route missing `requireAuth()` loader              | CRITICAL | Auth         |
| F07 | Auth logic reimplemented instead of using `framework-react-core` | HIGH | Auth    |
| F08 | MUI component used without `lib-seamlesscomponents-react` theme | MEDIUM | UI      |
| F09 | `static-config.json` missing required fields                | HIGH     | Config       |
| F10 | TypeScript `any` in frontend source                         | HIGH     | Quality      |
| F11 | `console.log` left in production component code             | MEDIUM   | Quality      |
| F12 | `.then()/.catch()` chains instead of `async/await`          | LOW      | Quality      |
| F13 | Component file exports no default export                    | LOW      | Structure    |
| F14 | `dangerouslySetInnerHTML` used without sanitisation         | HIGH     | Security     |
| F15 | `axios` called directly in component (not via service file) | HIGH     | Architecture |

---

## F01 / F15 — Service Layer Required

All API calls MUST live in `src/services/<feature>Api.ts`. Components and hooks call the service — never `axios` or `fetch` directly.

### ❌ NEVER
```typescript
// Inside a React component
useEffect(() => {
  axios.get('/api/v1/Users').then(r => setUsers(r.data));
}, []);
```

### ✅ ALWAYS
```typescript
// src/services/usersApi.ts
export async function listUsers(): Promise<User[]> {
  const { data } = await axios.get<User[]>('/api/v1/Users');
  return data;
}

// In the component
useEffect(() => {
  listUsers().then(setUsers).catch(() => setError('Failed to load users.'));
}, []);
```

---

## F02 — useEffect Dependency Arrays

Every value read inside `useEffect` must appear in its dependency array.

### ❌ NEVER
```typescript
useEffect(() => {
  fetchReport(reportId); // reportId used but missing from deps — stale closure
}, []);

useEffect(() => {
  setCount(count + 1); // re-runs infinitely
}, [count]);
```

### ✅ ALWAYS
```typescript
useEffect(() => {
  fetchReport(reportId);
}, [reportId]);

// Stable object deps: memoize first
const params = useMemo(() => ({ page, limit }), [page, limit]);
useEffect(() => { fetchData(params); }, [params]);
```

---

## F03 — Cleanup for Timers and Subscriptions

```typescript
// ❌ NEVER — interval leaks after unmount
useEffect(() => {
  const id = setInterval(pollStatus, 5000);
}, []);

// ✅ ALWAYS — return cleanup function
useEffect(() => {
  const id = setInterval(pollStatus, 5000);
  return () => clearInterval(id);
}, []);
```

---

## F04 — List Keys Must Be Stable IDs

```tsx
// ❌ NEVER — index-based keys break reconciliation on reorder/delete
{items.map((item, i) => <Row key={i} item={item} />)}

// ✅ ALWAYS — use a stable, unique field from the data
{items.map((item) => <Row key={item.id} item={item} />)}
```

---

## F05 — No Hardcoded Entra Config

`clientId`, `authority`, and API scopes come from `public/static-config.json` at runtime. They must never appear as string literals in source files.

### ❌ NEVER
```typescript
const msalConfig = {
  auth: {
    clientId: 'a1b2c3d4-...',          // hardcoded
    authority: 'https://login.microsoftonline.com/tenant-id',
  },
};
```

### ✅ ALWAYS — in `public/static-config.json`
```json
{
  "FRAMEWORK_UI_NAME": "My App",
  "clientId": "",
  "authority": "https://login.microsoftonline.com/<tenant-id>",
  "scopes": ["api://my-app/Read"]
}
```

---

## F06 / F07 — Auth via `framework-react-core`

Every protected route MUST use `loader: requireAuth()`. Do not reimplement token logic, login redirects, or MSAL configuration.

### ❌ NEVER
```typescript
// Reimplementing auth check in the component
function Dashboard() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  ...
}
```

### ✅ ALWAYS
```typescript
// router.tsx
import { requireAuth } from 'framework-react-core/routes';

const router = createBrowserRouter([
  { path: '/dashboard', loader: requireAuth(), element: <Dashboard /> },
  { path: '/auth/callback', element: <AuthCallback /> }, // public — no loader
]);
```

---

## F08 — MUI Theme

All components must render inside a `ThemeProvider` using `claTheme` or `claDarkTheme` from `lib-seamlesscomponents-react`. This is wired in `App.tsx` — do not nest a second `ThemeProvider` or use a bare MUI theme.

```tsx
// App.tsx — correct
import { claTheme } from 'lib-seamlesscomponents-react';

export function App() {
  return (
    <ThemeProvider theme={claTheme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
```

Use `sx` prop or `styled()` for custom styles — never inline `style={{}}` for anything beyond one-off layout adjustments.

---

## F09 — `static-config.json` Required Fields

`public/static-config.json` must contain all of the following (values may be empty strings filled at deploy time, but keys must be present):

```json
{
  "FRAMEWORK_UI_NAME": "<App display name>",
  "clientId": "",
  "authority": "",
  "scopes": [],
  "navItems": []
}
```

Audit: read the file and verify all keys exist. Missing keys cause silent auth failures at runtime.

---

## F10 / F11 / F12 — TypeScript Quality

Same rules as the backend (see `02-code-quality.md`), applied to frontend TypeScript:

- **F10**: No `any` — use proper types or `unknown` with a type guard
- **F11**: No `console.log` in component, hook, or service files. Use the logger or remove.
- **F12**: Use `async/await` — no `.then()/.catch()` chains in new code

---

## F13 — Default Exports

Every page component file must have a default export so React Router lazy-loading and the import in `router.tsx` work without aliasing.

```typescript
// ✅
function MyExpenses() { ... }
export default MyExpenses;
```

---

## F14 — No `dangerouslySetInnerHTML` Without Sanitisation

```tsx
// ❌ NEVER — XSS risk
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ If HTML rendering is genuinely required, sanitise first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

---

## Audit Checklist

When auditing `web-<app-name>/src/`:

1. **Services**: every feature has a file in `src/services/` — no `axios` calls in `src/pages/` or `src/components/`
2. **Router**: every route except `/auth/callback` has `loader: requireAuth()`
3. **static-config.json**: all required keys present, no hardcoded Entra values in `.ts`/`.tsx` files
4. **Hooks**: all `useEffect` calls have correct deps; subscriptions/intervals return cleanup
5. **Keys**: no `key={index}` in any mapped list
6. **Types**: no `any` in `src/`; no `console.log` in `src/`
7. **Theme**: `App.tsx` wraps in `claTheme` or `claDarkTheme`; no bare `createTheme()` calls
8. **XSS**: no `dangerouslySetInnerHTML` without `DOMPurify`
