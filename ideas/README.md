# Ideas Directory

This directory contains raw ideas for new applications. Each app gets its own subdirectory.

## Structure

```
ideas/
└── <app-name>/
    ├── ideas.md                    ← Required: the primary idea description (see template below)
    ├── technical-constraints.md    ← Optional: infrastructure limits, integration requirements
    ├── competitor-notes.md         ← Optional: detailed competitive research or positioning
    ├── personas.md                 ← Optional: extended user research or role definitions
    ├── open-questions.md           ← Optional: unresolved design decisions to flag
    └── *.png / *.jpg               ← Optional: Figma exports, wireframes, or UI sketches
```

The `<app-name>` should be the intended repo name in kebab-case (e.g., `expense-tracker`, `liquidity-event-os`). This name is used as the argument to all three spec-kit commands.

### Multi-file ideas

`ideas.md` is always the primary file — `/design` reads it first. Any additional `.md` files in the same directory are treated as **supplementary context** and merged into the requirements automatically. Use supplementary files when a single `ideas.md` becomes too long, or when different people are contributing different parts of the idea (e.g., a product manager owns `ideas.md` while an engineer writes `technical-constraints.md`).

Each supplementary file is free-form. Name it after what it contains. `/design` will synthesise all files together rather than treating them as separate sections.

## Running the design command

Once you have created `ideas/<app-name>/ideas.md`, run:

```
/design <app-name>
```

Copilot will read your idea and generate the full requirements set in `/requirements/<app-name>/`.
See `/requirements/example/` for the kind of output that command produces.

---

## Template A — Full-stack app (frontend + backend + DB)

Use this for apps with a user-facing SPA. Generates all three repos: `web-api-<app>`, `web-<app>`, `db-<app>`.

Copy into `ideas/<your-app-name>/ideas.md`:

```markdown
# <App Name>

## What it does
<!-- One paragraph describing the app. What does it do? What problem does it solve? -->

## Who uses it
<!-- Who are the primary users? Internal team? Customers? Advisors? Specific job roles? -->

## The problem
<!-- What pain does this solve? Why is the status quo inadequate? -->

## Key features
<!-- Bullet list of the capabilities you want in the MVP -->
- 
- 
- 

## Nice to have (post-MVP)
<!-- Features that would be great but aren't required to launch -->
- 
- 

## Competitors or alternatives
<!-- What do people do today instead? Spreadsheets? Another tool? Manual process? -->

## Rough revenue model
<!-- How would this make money? Subscription? Per-seat? Per-transaction? Internal tool (no revenue)? -->

## Visual references (optional)
<!-- Describe any images you've put in this folder. What they show and what's important about them. -->
<!-- Example: "screen1.png shows the main dashboard concept with a summary card layout" -->

## Open questions
<!-- Anything you're unsure about that you want the requirements to explore -->
- 
```

---

## Template B — API-only app (no frontend)

Use this for apps that expose an API consumed by other services, scripts, or third-party clients — no React SPA needed. Still generates `web-api-<app>` and `db-<app>`; the `web-<app>` repo is omitted.

Add the line `**Type: API-only**` at the top of your `ideas.md` — `/design` and `/create` will skip the frontend scaffold.

```markdown
# <App Name>

**Type: API-only**

## What it does
<!-- One paragraph. What does this API do? What systems or consumers will call it? -->

## Who calls it
<!-- Which systems, teams, or client types will consume this API?
     e.g. "internal microservices", "mobile apps via BFF", "third-party webhook consumers" -->

## The problem
<!-- What does this API replace or enable that isn't possible today? -->

## Endpoints / capabilities
<!-- List the main capabilities — not full REST routes, just what it needs to do -->
- 
- 
- 

## Data it owns
<!-- What data does this API store or manage? These become DB tables. -->
- 

## Auth requirements
<!-- Who can call this API and how?
     e.g. "internal services with client credentials", "external partners with API keys",
     "user-delegated tokens from the SPA" -->

## Nice to have (post-MVP)
- 

## Open questions
- 
```
