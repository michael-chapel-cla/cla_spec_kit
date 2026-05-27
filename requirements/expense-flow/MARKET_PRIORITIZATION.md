# Market Prioritization — ExpenseFlow

## Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Market size | 7/10 | Hundreds of thousands of 50–500 employee companies in English-speaking markets alone; not a niche |
| Ease of build | 7/10 | Standard CRUD + blob storage + email; no novel ML or compliance infrastructure required for MVP |
| Speed to revenue | 8/10 | Trial-to-paid cycle driven by a single month-end close event; short sales cycle, no IT procurement |
| Urgency of pain | 7/10 | Pain is real and recurring but not acute in the moment — finance directors tolerate it until they stop tolerating it |
| Buyer clarity | 9/10 | Finance director or HR manager — clear role, clear authority, clear budget, reachable on LinkedIn |
| Switching cost (moat) | 8/10 | Once approval chains, policies, and department structure are configured, switching is meaningful friction |
| Competitive intensity | 6/10 | Well-served at enterprise (Concur) and consumer (Expensify) ends; mid-market genuinely underserved |
| Trust / compliance burden | 4/10 | Low — no financial regulation (not a payments product); GDPR applies but is standard SaaS practice |
| **Total** | **56/80** | |

## Summary

ExpenseFlow sits in the attractive part of the build-vs-market matrix: the pain is real and recurring, the buyer is obvious and reachable, the product is technically achievable on a modern SaaS stack in a short timeframe, and the moat comes from workflow configuration rather than data moats or regulatory barriers. The mid-market gap is genuine — no dominant player owns it.

## Why it can win

- **Buyer clarity**: finance directors and HR managers are highly reachable, have direct budget authority, and share the same pain across industries
- **Short sales cycle**: a 30-day trial converts at month-end — the product proves itself in one billing cycle
- **Workflow lock-in**: approval chains, policy rules, and department structure create meaningful switching costs after 3–6 months of use
- **Underserved gap**: the space between Expensify (consumer) and Concur (enterprise) is real and not effectively contested by any single product
- **Low compliance burden**: unlike payroll or payments, expense management does not require financial licences or deep regulatory infrastructure

## Why it's harder

- **Episodic urgency**: the pain is monthly, not daily — finance directors tolerate it until a trigger (bad audit, CFO complaint, key employee complaint). Outbound must hit at the right moment.
- **Low switching moment**: companies already using a spreadsheet will keep using it until something breaks. The trigger for change is often an external event, not a proactive decision.
- **Zoho Expense price pressure**: for Zoho ecosystem companies, Zoho Expense is the default low-price option. Do not try to compete on price with Zoho customers — target companies not already in that ecosystem.
- **Enterprise sales complexity**: companies over 200 employees often need IT sign-off, security review, and a formal procurement process. Avoid targeting this segment until the Growth tier has a strong retention signal.

## Priority segment order

| Priority | Segment | Why first |
|---|---|---|
| 1 | Professional services, 50–150 employees | High field spend, reachable finance director, no ERP complexity |
| 2 | Field services / logistics, 50–200 employees | Regular employee out-of-pocket spend; receipt management is a known pain |
| 3 | Healthcare (non-clinical staff), 100–300 employees | Policy compliance sensitivity makes structured approval trail valuable |
| 4 | Technology companies, 100–500 employees | Aware of SaaS tooling; willing to pay for good UX; but may already use Ramp/Brex |
| Defer | Enterprise (500+) | Procurement complexity, SAML requirements, SLA expectations — Phase 3 |
| Defer | Zoho/QuickBooks-native SMBs | Price-sensitive; already partially served; low conversion likelihood |
