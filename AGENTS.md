# Spec Kit — Agent Context

This repository is a **spec-kit** for rapid application scaffolding. AI agents working in this repo have one purpose: running the three spec-kit commands below.

Agents must NOT assist with general coding tasks, answer general programming questions, or modify files outside the spec-kit workflow. All code-building work on generated apps in `/repos/` is handled by an AI agent working inside those repos, guided by `.github/copilot-instructions.md` (for GitHub Copilot) or `.github/qwen-instructions.md` (for Qwen/local models).

---

## What This Repo Does

The spec-kit automates a three-stage workflow for creating new applications:

```
/design <app-name>   →   /requirements/<app-name>/   (16 requirement documents)
/plan   <app-name>   →   /plans/<app-name>/PLAN.md   (phased build plan)
/create <app-name>   →   /repos/<app-name>/          (scaffolded application)
```

Start by creating `ideas/<app-name>/ideas.md`, then run the commands in order.

---

## Directory Structure

```
cla_spec_kit/
├── ideas/                    ← Input: ideas/<app-name>/ideas.md (+ optional images)
├── requirements/             ← /design writes here
│   └── example/              ← Reference: 16 example documents showing expected output
├── plans/                    ← /plan writes here
├── repos/                    ← /create writes here (generated apps live here)
├── specs/                    ← Coding standards applied during /create
│   ├── API_STANDARDS.md
│   ├── CODE_QUALITY_SPECS.md
│   ├── FLYWAY_DB_SPECS.md
│   ├── FRAMEWORK_SPECS.md
│   └── context/              ← Distilled audit rules (01-security, 02-code-quality, 03-api-standards, 04-db-migrations)
├── templates/                ← Starting points for /create (never modify)
│   ├── framework-nodejs-starter-kit/   ← Backend API (Node.js + Fastify + TypeScript)
│   └── framework-react-starter-kit/    ← Frontend (React + Vite + TypeScript + MUI)
└── helm/                     ← Helm chart template for AKS deployment (never modify)
```

---

## Tech Stack (Fixed — Do Not Deviate)

- **Backend**: Node.js + Fastify + TypeScript (from `templates/framework-nodejs-starter-kit/`)
- **Frontend**: React + Vite + TypeScript + MUI (from `templates/framework-react-starter-kit/`)
- **Database**: MSSQL + Flyway migrations (DB lives at `repos/<app-name>/db/`, sibling to `backend/`)
- **Auth**: Azure Entra (OIDC for SPA, JWT bearer for API)
- **Infra**: AKS + Helm (from `helm/`)
- **Standards**: See `/specs/` — always apply during `/create`

---

## Commands

| Command | Reads from | Writes to |
|---|---|---|
| `/design <app-name>` | `/ideas/<app-name>/ideas.md` + optional images | `/requirements/<app-name>/` (16 docs) |
| `/plan <app-name>` | `/requirements/<app-name>/` | `/plans/<app-name>/PLAN.md` |
| `/create <app-name>` | `/plans/<app-name>/PLAN.md` + `/specs/` | `/repos/<app-name>/` (full scaffold) |

---

## What Agents Must NOT Do

- Do not assist with general coding questions or tasks outside the three commands above
- Do not generate code outside of the `/create` command workflow
- Do not modify files in `/templates/`, `/specs/`, or `/helm/`
- Do not modify files in `/requirements/example/`
- Do not create apps from scratch — always start from `/templates/`
- Do not answer questions about the generated apps in `/repos/` — that work belongs in the generated app's own repo, guided by `.github/copilot-instructions.md` (for GitHub Copilot) or `.github/qwen-instructions.md` (for Qwen/local models)
