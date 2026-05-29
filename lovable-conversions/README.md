# Lovable → Full-Stack Conversion

This directory holds Lovable vibe-coded apps that you want to convert into production-ready, enterprise full-stack scaffolds.

Each app goes in its own subdirectory. Drop the Lovable export in, then run one command.

---

## Quick start

```
lovable-conversions/
└── my-app/          ← paste your Lovable export here
    ├── src/
    ├── package.json
    └── ...
```

Then in Claude Code:

```
/convert my-app
```

That's it. The command runs the full pipeline and produces three repos in `/repos/`.

---

## What `/convert` does

The command runs three phases automatically, in sequence. There is no requirements/design phase — you already have a working app, so the agent goes straight from source to plan to scaffold.

```
Lovable source  →  Plan                       →  Three scaffolded repos
/lovable-conversions/<app>     /plans/<app>/PLAN.md          /repos/web-api-<app>/
                                                 /repos/web-<app>/
                                                 /repos/db-<app>/
```

### Phase 1 — Source analysis

The agent reads every file in your Lovable export and extracts:

- **Pages and routes** — from React Router definitions, page components, and nav structure
- **Data model** — from `src/integrations/supabase/types.ts` (authoritative if present), TypeScript interfaces, and any SQL migrations in `supabase/migrations/`
- **Features and operations** — every CRUD operation, approval flow, export, notification trigger, or search pattern visible in the code
- **User roles** — from route guards, role checks in components, and Supabase RLS policy comments
- **External integrations** — third-party APIs, webhooks, Supabase Storage usage

Nothing is invented. If it is not in the source, it does not go into the plan.

### Phase 2 — Plan generation

Produces `/plans/<app-name>/PLAN.md` directly from the source analysis — no intermediate requirements documents. The plan contains everything `/create` needs:

| Plan section | Derived from |
|---|---|
| API endpoints | `supabase.from()` calls, hooks, form submissions |
| Database schema | Supabase types / SQL migrations → MSSQL table specs |
| Frontend pages | Route definitions, page components → MUI-mapped pages |
| TDD contract | Named `it()` cases for every service, route, and page |
| Build phases | Tests before implementation, Lovable MVP as Phase 1 baseline |
| Deferred features | Supabase Realtime, Storage → Phase 2 |

### Phase 3 — Scaffold

Produces three repos in `/repos/`, the same output as `/create`:

| Repo | Contents |
|---|---|
| `web-api-<app-name>` | Fastify API — routes, services, schemas, OpenAPI spec, Postman collection, Helm chart, devcontainer |
| `web-<app-name>` | React SPA — pages, service layer, MUI components, static auth config, Helm chart, devcontainer |
| `db-<app-name>` | Flyway SQL migrations — one file per table or logical group, devcontainer |

---

## Stack translation

Lovable apps are built on Supabase + Tailwind + shadcn/ui. The conversion maps everything to the fixed enterprise stack:

| Lovable / Supabase | Converted to |
|---|---|
| Supabase tables (`public.*`) | MSSQL tables (`dbo.*`) + Flyway migration file |
| Supabase auth (JWT, `auth.users`) | Azure Entra via APIM — API reads `x-user-id`, `x-user-email`, `x-user-roles` headers |
| Supabase Row Level Security | Fastify `requireScope(role)` middleware |
| `supabase.from(table)` client calls | Fastify API routes + parameterized MSSQL queries |
| Supabase Edge Functions | Fastify feature route handlers |
| Supabase Realtime / subscriptions | Deferred to post-MVP (noted in `ROADMAP.md`) |
| Supabase Storage | Azure Blob Storage — noted in requirements if present |
| Tailwind CSS | MUI v6 `sx` prop or `styled()` |
| shadcn/ui components | MUI equivalents (`Button`, `Dialog`, `DataGrid`, `DatePicker`, etc.) |
| React Query / TanStack Query | Service layer (`src/services/<feature>Api.ts`) + component state |
| `lucide-react` icons | MUI Icons (`@mui/icons-material`) |
| Zod (client-side) | Zod schemas in `<feature>.schema.ts` (backend validation) |

The auth model change is the biggest shift. Lovable apps handle auth in the client via Supabase JWT. The converted app delegates all auth to Azure API Management — the API never validates tokens; it reads forwarded identity headers only. The SPA authenticates via Entra OIDC using `framework-react-core`.

---

## What to include in your Lovable export

More source = better output. The agent uses these files directly:

| File / directory | Why it matters |
|---|---|
| `src/integrations/supabase/types.ts` | Authoritative data model — column names, types, relationships |
| `supabase/migrations/*.sql` | Full schema with indexes, constraints, foreign keys |
| `src/App.tsx` or router file | Page list and route structure |
| `src/pages/**/*.tsx` | Page purpose, data displayed, actions available, role checks |
| `src/hooks/**/*.ts` | Business operations and data access patterns |
| `src/types/**/*.ts` | Domain entity definitions |
| `src/components/**/*.tsx` | UI patterns, form fields, shared components |
| `package.json` | Dependencies reveal third-party integrations |
| `README.md` | App description and context |

If your Lovable app uses Supabase, export the TypeScript types (`supabase gen types typescript`) and include them. The agent treats `src/integrations/supabase/types.ts` as the ground-truth schema.

---

## What gets dropped

These Lovable-specific things are not carried over:

- **Supabase auth** — replaced entirely by Azure Entra / APIM forwarded headers
- **Supabase Realtime** — deferred to post-MVP in `ROADMAP.md`
- **`lovable.dev` URLs and Lovable platform config** — omitted
- **Tailwind, shadcn, and `lucide-react`** — replaced by MUI v6
- **Supabase client (`@supabase/supabase-js`)** — replaced by a typed Fastify API + mssql pool

Anything deferred (not dropped) appears in `ROADMAP.md` Phase 2 or 3 with an explanation.

---

## Tips for best results

**Export the full project, not just components.** The agent needs the router, type files, and Supabase integration to reconstruct the complete picture.

**Include Supabase migrations if you have them.** `supabase/migrations/*.sql` gives exact column types, indexes, and foreign keys — far more reliable than inferring from TypeScript types alone.

**Name the directory clearly.** The directory name becomes the app name throughout the pipeline: repo names (`web-api-<name>`), plan file, requirements folder, Docker image names, Helm chart names. Use kebab-case.

**Check `ROADMAP.md` after conversion.** It lists everything deferred from the Lovable source — half-built pages, TODO comments, placeholder sections — as Phase 2 work. Review it to make sure nothing important was misclassified.

**Run `/validate <app-name>` after `/convert`.** The validate command audits the generated scaffold against coding standards and produces a scored report. Run it to catch any gaps before development starts.

---

## Full pipeline reference

```
# Standard pipeline (starting from scratch)
# 1. Create ideas/<app-name>/ideas.md
# 2. Run in order:
/design <app-name>    → requirements/<app-name>/  (17 docs)
/plan <app-name>      → plans/<app-name>/PLAN.md
/create <app-name>    → repos/ (3 repos)

# Lovable pipeline (starting from a vibe-coded prototype)
# 1. Export Lovable project into lovable-conversions/<app-name>/
# 2. Run once — skips design/requirements entirely:
/convert <app-name>   → plans/<app-name>/PLAN.md + repos/ (3 repos)

# Either pipeline — audit the output:
/validate <app-name>  → scored compliance report
```

---

## Directory layout

```
lovable-conversions/
├── README.md              ← you are here
└── <app-name>/            ← one directory per Lovable app
    ├── src/
    │   ├── App.tsx        ← router / entry point
    │   ├── pages/         ← page components
    │   ├── components/    ← shared UI components
    │   ├── hooks/         ← data access hooks
    │   ├── types/         ← TypeScript interfaces
    │   └── integrations/
    │       └── supabase/
    │           └── types.ts  ← Supabase-generated schema types (gold mine)
    ├── supabase/
    │   └── migrations/    ← SQL migration files (include if available)
    ├── package.json
    ├── index.html
    └── README.md          ← Lovable's own readme (if any)
```
