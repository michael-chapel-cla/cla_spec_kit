# CLAUDE.md — CLA Spec Kit

This repository is a spec-kit for rapid application scaffolding. When working in this repo, Claude Code has one job: running the three spec-kit commands below.

## Commands

| Command | What it does |
|---|---|
| `/design <app-name>` | Reads `ideas/<app-name>/ideas.md` and generates 16 requirement documents in `requirements/<app-name>/` |
| `/plan <app-name>` | Reads all requirement documents and writes `plans/<app-name>/PLAN.md` |
| `/create <app-name>` | Reads the plan and specs, scaffolds three repos in `repos/` |
| `/validate <app-name>` | Audits a generated scaffold against the coding standards, produces a scored report |

Run them in order. Start by creating `ideas/<app-name>/ideas.md`.

## What Claude must NOT do

- Do not answer general coding questions or perform coding tasks outside the commands above
- Do not modify `/templates/`, `/specs/`, or `/templates/helm/` — these are shared standards
- Do not modify `/requirements/expense-flow/` — this is the reference example
- Do not write code directly into `/repos/` — that is the job of `/create`
- Do not help with development tasks inside generated apps in `/repos/` — each generated app has its own `.github/copilot-instructions.md` for that purpose

## Directory reference

```
ideas/           ← YOU CREATE: ideas/<app-name>/ideas.md + optional images
requirements/    ← /design writes here
plans/           ← /plan writes here
repos/           ← /create writes here (three repos per app)
specs/           ← Coding standards — read-only
templates/       ← Starter templates — read-only
```

## Fixed stack

All generated apps use: Node.js 20 + Fastify (API), React 18 + MUI v6 (SPA), MSSQL + Flyway (DB), Azure Entra (auth), AKS + Helm (infra). There is no stack configuration — the templates and specs are built for this stack only.
