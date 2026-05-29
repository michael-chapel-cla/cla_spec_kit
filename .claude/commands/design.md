Read `.github/prompts/design.prompt.md` and execute every step it describes for the app named **$ARGUMENTS**, substituting `$ARGUMENTS` for every occurrence of `${input:appName}`.

**Input:** `ideas/$ARGUMENTS/ideas.md` (must exist before running this command). Also read any other `.md` files and image files in `ideas/$ARGUMENTS/`.

**Output:** 17 separate `.md` files written to `requirements/$ARGUMENTS/`:
- README.md, EXECUTIVE_SUMMARY.md, PRD.md, PITCH.md, HLD.md, LLD.md, SYSTEM_ARCHITECTURE.md, DATA_MODEL.md, MVP_BUILD_SPEC.md, COMPETITIVE_ANALYSIS.md, CUSTOMER_PERSONAS.md, ROADMAP.md, LANDING_PAGE.md, GO_TO_MARKET.md, PRICING_AND_POSITIONING.md, MARKET_PRIORITIZATION.md, TDD.md

**Format guardrails:**
- Each document is a standalone `.md` file — no code blocks with bash or SQL inside requirement documents
- No task execution steps, no verification commands, no commit instructions
- No "For Hermes" headers or agent-specific meta-instructions in any output file
- Content is specific to $ARGUMENTS — no placeholder text, no generic filler; flag assumptions with `> **Assumption:**`
- Technical documents (HLD, LLD, DATA_MODEL, SYSTEM_ARCHITECTURE) must name specific libraries, ports, and conventions — not generic descriptions
- Business documents (PRD, PITCH, EXECUTIVE_SUMMARY) must be grounded in the actual problem — no generic SaaS copy
- All three repo names follow the pattern: `web-api-$ARGUMENTS`, `web-$ARGUMENTS`, `db-$ARGUMENTS`
- All repo paths are flat in `repos/`: `repos/web-api-$ARGUMENTS/`, `repos/web-$ARGUMENTS/`, `repos/db-$ARGUMENTS/` — never nested under a subfolder
- CI/CD references use GitHub Actions (`.github/workflows/ci.yml`) — never `azure-pipelines.yml`
