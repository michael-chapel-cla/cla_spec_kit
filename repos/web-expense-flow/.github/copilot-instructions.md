# Copilot Instructions — web-expense-flow

## What this repo is

The ExpenseFlow React SPA. MUI v6 component library, Azure Entra OIDC auth via `framework-react-core`.

## Stack

| Layer | Technology |
|---|---|
| UI framework | React 18, TypeScript |
| Component library | MUI v6 (`@mui/material`, `@mui/icons-material`) |
| Auth | `framework-react-core` (MSAL PKCE wrapper) |
| Theme | `lib-seamlesscomponents-react` (`claTheme`, `claDarkTheme`) |
| Routing | React Router v7 (`createBrowserRouter`) |
| HTTP client | Axios |
| Testing | Vitest + Testing Library, 85% coverage floor |
| Storybook | v8 |
| Linting | ESLint via `framework-eslint-config` |

## Structure

```
src/
  App.tsx                       # ThemeProvider + RouterProvider
  router.tsx                    # All routes with requireAuth() loaders
  types/
    expenseFlow.types.ts
  services/
    expenseReportsApi.ts
    approvalsApi.ts
    usersApi.ts
    policiesApi.ts
    reportsApi.ts
  components/
    StatusChip.tsx
    CurrencyDisplay.tsx
  pages/
    MyExpenses/
    NewReport/
    ReportDetail/
    ApprovalQueue/
    ApprovalDetail/
    FinanceDashboard/
    Policies/
    Users/
    AuthCallback.tsx
public/
  static-config.json            # App name, Entra client config, scopes, nav
```

## Conventions

- All API calls go through `src/services/` — no inline `axios` in page components
- Loading / error states on every data-fetching page
- `requireAuth()` loader on every protected route
- Navbar items, app title, and Entra scopes configured in `public/static-config.json`
- MUI `slotProps` API (not deprecated `InputLabelProps`) for form fields
- No hardcoded Entra clientId / authority / scope strings in source files

## API base URL

All service calls use `/api/v1/` — the Vite dev server proxies this to `http://localhost:8080`.

## What NOT to help with

- `/templates/` — hands-off, managed by the spec-kit
- `/specs/` — standards docs, not editable
- `/requirements/` and `/plans/` — spec-kit artefacts
