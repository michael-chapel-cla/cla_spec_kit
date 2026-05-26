# Ideas Directory

This directory contains raw ideas for new applications. Each app gets its own subdirectory.

## Structure

```
ideas/
└── <app-name>/
    ├── ideas.md          ← Required: the idea description (see template below)
    └── *.png / *.jpg     ← Optional: Figma exports, wireframes, or UI sketches
```

The `<app-name>` should be the intended repo name in kebab-case (e.g., `expense-tracker`, `liquidity-event-os`). This name is used as the argument to all three spec-kit commands.

## Running the design command

Once you have created `ideas/<app-name>/ideas.md`, run:

```
/design <app-name>
```

Copilot will read your idea and generate the full requirements set in `/requirements/<app-name>/`.
See `/requirements/example/` for the kind of output that command produces.

---

## Template for `ideas.md`

Copy this template into `ideas/<your-app-name>/ideas.md` and fill it in. Not every section needs to be detailed — Copilot will infer and make reasonable assumptions for anything you leave sparse.

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
