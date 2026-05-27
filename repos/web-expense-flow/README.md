# web-expense-flow

React SPA for the ExpenseFlow expense management platform. Provides employee expense submission, manager approval, and finance reporting interfaces.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- `web-api-expense-flow` running locally (at `http://localhost:8080`) or accessible via network

## Local development

```bash
# Install dependencies
npm install

# Start dev server (proxies /api/* to localhost:8080)
npm run dev
```

The app opens at `http://localhost:3000`.

## Running with Docker Compose

```bash
docker-compose up
```

This starts a standalone frontend container. The API must be running separately (see `web-api-expense-flow`).

## Scripts

```bash
npm run dev              # Vite dev server on port 3000
npm run build            # Production build to dist/
npm test                 # Vitest with coverage
npm run storybook        # Storybook on port 6006
npm run lint             # ESLint
```

## Project structure

```
src/
  App.tsx                  # ThemeProvider + RouterProvider
  router.tsx               # Route definitions with requireAuth() loaders
  types/
    expenseFlow.types.ts   # Shared domain types
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
  static-config.json       # App title, Entra config, nav items
test/
  unit/
  stories/
helm/
```

## Authentication

Auth is handled by `framework-react-core` via `public/static-config.json`. No Entra client IDs are hardcoded in source files. Update `static-config.json` per environment before deployment.

## Helm deployment

```bash
helm upgrade --install web-expense-flow ./helm \
  -f ./helm/values-dev.yaml \
  --set image.tag=<image-tag>
```
