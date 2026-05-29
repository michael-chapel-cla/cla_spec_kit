# Framework Usage Rules

> Load this file when auditing or generating code that uses the CLA internal framework packages. Rules cover `framework-nodejs-fastify`, `framework-react-core`, `lib-seamlesscomponents-react`, and `framework-eslint-config`.

---

## Quick Reference — All Rules

| #   | Rule                                                                   | Severity | Package                    |
| --- | ---------------------------------------------------------------------- | -------- | -------------------------- |
| W01 | App created without `FrameworkFastify.create()`                        | CRITICAL | framework-nodejs-fastify   |
| W02 | Config not initialised with `framework.initAppConfig()`                | HIGH     | framework-nodejs-fastify   |
| W03 | `useEnvironmentVariables` not set to `true` in production              | HIGH     | framework-nodejs-fastify   |
| W04 | Route plugin not registered via `app.register()` with `prefix`         | HIGH     | framework-nodejs-fastify   |
| W05 | Route plugin signature does not accept `FastifyPluginOptions & { db }` | MEDIUM   | framework-nodejs-fastify   |
| W06 | `framework.start()` not called (or called before plugins registered)   | CRITICAL | framework-nodejs-fastify   |
| W07 | Auth not using `requireScope()` — raw `authMiddleware` on admin routes | HIGH     | framework-nodejs-fastify   |
| W08 | `requireAuth()` not used as route loader in protected routes           | CRITICAL | framework-react-core       |
| W09 | Auth logic reimplemented instead of using `framework-react-core`       | HIGH     | framework-react-core       |
| W10 | `RouterProvider` not wrapped in `ThemeProvider` with `claTheme`        | MEDIUM   | lib-seamlesscomponents-react |
| W11 | `claTheme` / `claDarkTheme` not imported from `lib-seamlesscomponents-react` | MEDIUM | lib-seamlesscomponents-react |
| W12 | ESLint config extends something other than `framework-eslint-config`   | MEDIUM   | framework-eslint-config    |

---

## `framework-nodejs-fastify`

### W01 / W02 / W03 / W06 — App Startup Sequence

The correct startup sequence is fixed. Do not deviate.

### ✅ Correct `app.ts`
```typescript
import 'framework-nodejs-appconfig';
import FrameworkFastify from 'framework-nodejs-fastify';

const framework = await FrameworkFastify.create();

await framework.initAppConfig({
  useEnvironmentVariables: true,       // W03: must be true in production
  fileConfigPath: './src/static-config.json',
});

const app = framework.app;

// Register security plugins first
await app.register(helmet, { ... });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

// Register feature route plugins
await app.register(myFeatureRoutes, { prefix: '/api/v1', db });

// Start last — W06
await framework.start();
```

### ❌ Never
```typescript
// W01 — creating Fastify directly, bypassing the framework
const app = fastify();

// W06 — calling start before all plugins are registered
await framework.start();
await app.register(myRoutes, { prefix: '/api/v1', db }); // too late
```

---

### W04 / W05 — Route Plugin Signature

Every feature route file must export an `async function` with the Fastify plugin signature. The `db` client is passed via options — never imported as a module-level singleton inside route files.

### ✅ Correct plugin signature
```typescript
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { DbClient } from '../../../shared/db/db.client.js';

export async function myFeatureRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) {
  const service = new MyFeatureService(options.db);

  app.get('/MyFeature', { preHandler: authMiddleware }, async (req, reply) => {
    return reply.send(await service.list(req.user.tenantId));
  });
}
```

### ❌ Never
```typescript
// W05 — no db in options, reaching for a global instead
export async function myFeatureRoutes(app: FastifyInstance) {
  const db = getGlobalDb(); // wrong
}

// W04 — route not registered with a prefix
await app.register(myFeatureRoutes); // no prefix
```

---

### W07 — `requireScope` vs `authMiddleware`

Use `authMiddleware` only on routes accessible to all authenticated users (any role). Use `requireScope(...roles)` for role-gated routes.

```typescript
// ✅ Any authenticated user
app.get('/ExpenseReports', { preHandler: authMiddleware }, ...);

// ✅ Finance or admin only
app.get('/Reports/Spend', { preHandler: requireScope('finance', 'admin') }, ...);

// ❌ W07 — admin-only route using bare authMiddleware (no role check)
app.delete('/Policies/:id', { preHandler: authMiddleware }, ...);
```

`requireScope` calls `authMiddleware` internally — do not stack both on the same route.

---

### DB Client — `createDbClient`

The pool is a singleton created once at startup in `app.ts`, then passed to all route plugins via `options.db`. Service classes receive `DbClient` via constructor injection.

```typescript
// app.ts — create once
const db = await createDbClient();
await app.register(myFeatureRoutes, { prefix: '/api/v1', db });

// myFeature.service.ts — constructor injection
export class MyFeatureService {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: number) {
    const result = await this.db.executeQuery((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .query(`SELECT * FROM dbo.MyTable WHERE TenantId = @tenantId`),
    );
    return result.recordset;
  }
}
```

`trustServerCertificate` is automatically `true` in non-production (local Docker). Never set it to `true` in production.

---

## `framework-react-core`

### W08 / W09 — Route Protection

`framework-react-core` handles all MSAL token acquisition, refresh, and login redirects. Do not reimplement this logic.

### ✅ Correct usage
```typescript
import { requireAuth } from 'framework-react-core/routes';
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  // W08: every protected route must have this loader
  { path: '/expenses',        loader: requireAuth(), element: <MyExpenses /> },
  { path: '/expenses/:id',    loader: requireAuth(), element: <ReportDetail /> },
  { path: '/admin/policies',  loader: requireAuth(), element: <Policies /> },

  // Public — no loader
  { path: '/auth/callback',   element: <AuthCallback /> },
]);
```

### ❌ Never
```typescript
// W09 — manual token check in component
function Dashboard() {
  const isLoggedIn = !!sessionStorage.getItem('msal.idtoken');
  if (!isLoggedIn) return <Navigate to="/login" />;
  ...
}

// W08 — protected route with no loader
{ path: '/admin', element: <Admin /> }
```

### Auth Config Source

All Entra configuration lives in `public/static-config.json`. `framework-react-core` reads this file at startup. Source code must never contain `clientId`, `authority`, or scope URI strings as literals.

```json
{
  "FRAMEWORK_UI_NAME": "My App",
  "clientId": "",
  "authority": "https://login.microsoftonline.com/<tenant-id>",
  "scopes": ["api://my-app/Read", "api://my-app/Write"]
}
```

---

## `lib-seamlesscomponents-react`

### W10 / W11 — Theme Provider

The CLA design system theme must wrap the entire app via `ThemeProvider`. Import `claTheme` (light) or `claDarkTheme` (dark) — never call MUI's `createTheme()` directly.

### ✅ Correct `App.tsx`
```tsx
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ThemeProvider } from '@mui/material/styles';
import { claTheme, claDarkTheme } from 'lib-seamlesscomponents-react';
import { RouterProvider } from 'react-router-dom';
import router from './router';

export function App() {
  return (
    <ThemeProvider theme={claTheme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
export default App;
```

### ❌ Never
```tsx
// W11 — custom theme bypassing lib-seamlesscomponents-react
import { createTheme } from '@mui/material/styles';
const myTheme = createTheme({ palette: { primary: { main: '#0078D4' } } });

// W10 — RouterProvider outside ThemeProvider
export function App() {
  return <RouterProvider router={router} />;  // no theme
}
```

---

## `framework-eslint-config`

### W12 — ESLint Config

All repos must extend `framework-eslint-config`. Do not replace or override it with a custom config that removes rules.

### ✅ `eslint.config.mts` (backend)
```typescript
import frameworkConfig from 'framework-eslint-config';
export default [...frameworkConfig];
```

### ✅ `eslint.config.js` (frontend)
```javascript
import frameworkConfig from 'framework-eslint-config';
export default [...frameworkConfig, { /* app-specific additions only */ }];
```

### ❌ Never
```javascript
// W12 — bypassing the framework config entirely
export default [{ rules: { '@typescript-eslint/no-explicit-any': 'off' } }];
```

---

## Audit Checklist

When auditing a generated app for framework compliance:

1. **`app.ts`**: `FrameworkFastify.create()` → `initAppConfig({ useEnvironmentVariables: true })` → register plugins → `framework.start()`
2. **Route plugins**: all exported as `async function` with `FastifyInstance, FastifyPluginOptions & { db: DbClient }` signature; all registered with `prefix: '/api/v1'`
3. **Auth**: `requireScope` used on role-gated routes; `authMiddleware` only on open-to-all-authenticated routes; never both stacked
4. **DB**: `createDbClient()` called once in `app.ts`; passed via `options.db`; service constructor receives `DbClient`
5. **`router.tsx`**: all routes except `/auth/callback` have `loader: requireAuth()`; no manual token logic in components
6. **`App.tsx`**: `RouterProvider` inside `ThemeProvider` with `claTheme` or `claDarkTheme`
7. **`static-config.json`**: `clientId`, `authority`, `scopes` keys present; no Entra literals in `.ts`/`.tsx` files
8. **ESLint**: `eslint.config.*` extends `framework-eslint-config`
