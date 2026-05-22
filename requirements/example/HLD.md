# HLD — LiquidityEventOS

## Product stance
LiquidityEventOS is a **standalone SaaS product**.

## Identity
LiquidityEventOS uses **Azure Entra**.

Recommended identity model:
- dedicated Entra app registration
- OIDC auth for React app
- JWT validation in Node.js APIs
- product-local collaborator and role model

## Overview
LiquidityEventOS is a multi-tenant SaaS platform for pre-liquidity planning around startup equity. It helps founders, employees, and advisors model grants, compare exercise and sale scenarios, surface QSBS/AMT-related issues, and coordinate action before key deadlines.

## Primary users
- founders
- pre-IPO employees
- startup-focused CPAs
- wealth advisors
- optional legal/collaborator viewers

## Core capabilities
- equity inventory management
- grant-level scenario modeling
- event timeline and checklist tracking
- exercise/tender/sale comparison
- collaboration and memo generation
- audit trail of assumptions and scenario outputs

## Runtime architecture
Deploy as its own product stack:
- standalone React app
- standalone Node.js API and workers
- dedicated MSSQL boundary
- product-specific Blob storage strategy
- dedicated Redis
- dedicated AKS environment/deployment

## Logical modules
1. Tenant and user management
2. Person/company/grant inventory
3. Equity rules engine
4. Scenario comparison engine
5. Checklist and task workflows
6. Reporting and memo generation
7. Collaboration and access controls

## Core flow
1. user logs in via Entra
2. grant/company/event data and docs are uploaded
3. document worker extracts structured fields where applicable
4. scenario worker computes outcomes
5. recommendation layer surfaces opportunities and risks
6. checklists and reports are generated for review

## Scale characteristics
- high-complexity per-case calculations
- episodic spikes
- medium document volume

## Redis usage
Use Redis for scenario dedupe locks, hot-reference caching, workflow state, and throttling.

## Risks
- high trust burden
- fragmented input quality
- tax/legal domain complexity

## Mitigations
- advisor review gates
- deterministic calculation ownership
- explicit draft/approved lifecycle
