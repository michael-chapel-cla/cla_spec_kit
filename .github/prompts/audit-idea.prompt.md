---
mode: agent
description: Pre-flight check on an ideas.md file before running /design — flags missing sections, vague scope, and anything likely to produce a weak requirements set.
tools:
  - codebase
  - findFiles
---

Audit the idea file for **${input:appName}** and report whether it is ready to run `/design`.

---

## WORKFLOW

### Step 1 — Read the idea

Read `ideas/${input:appName}/ideas.md` and any images in `ideas/${input:appName}/`.

---

### Step 2 — Score each section

Evaluate the idea against these criteria. Score each as ✅ Good, ⚠️ Weak, or ❌ Missing.

| Section | What good looks like |
|---|---|
| **What it does** | One clear paragraph explaining the product. A stranger should understand it in 30 seconds. |
| **Who uses it** | Named user roles with a sentence on each — not just "users" or "employees". |
| **The problem** | Specific pain with a reason the status quo fails. Avoid generic statements like "saves time". |
| **Key features** | At least 4 concrete features scoped to MVP. Each should be a capability, not a vague goal. |
| **Out of scope** | At least one thing explicitly excluded. Prevents `/design` from over-scoping. |
| **Competitors / alternatives** | Something about what people do today instead. Even "spreadsheets" is fine. |
| **Revenue model** | One sentence on monetisation — or explicitly "internal tool". |

---

### Step 3 — Run deeper checks

**Scope clarity**
- Does the feature list suggest a realistic MVP (buildable in weeks, not months)?
- Are there any features that are vague enough that `/design` might interpret them very differently from what was intended? Flag them.
- Are there implicit features that are obviously required but not mentioned (e.g. an approval workflow implied by "managers review requests" but not listed)?

**Role coverage**
- Are there at least two distinct user roles defined? (Single-role apps tend to produce thin requirements.)
- Does each role have at least one feature tied to it?

**Technical red flags**
- Does the idea require capabilities outside the fixed stack (e.g. real-time push, native mobile, ML/AI, payment processing)? Flag each one — they won't be scaffolded.
- Are there any integration requirements (external APIs, SSO with non-Entra providers, third-party services)? Flag them as assumptions to resolve before running `/design`.

**Ambiguities**
- List any specific questions that, if left unanswered, will force `/design` to make assumptions that might be wrong. Phrase each as a concrete question.

---

### Step 4 — Output the report

Format the report exactly as shown:

---

## Idea Audit: ${input:appName}

**Verdict: READY / NEEDS WORK / BLOCKED**

> READY = safe to run /design now  
> NEEDS WORK = improve flagged sections first for best output  
> BLOCKED = one or more critical gaps that will produce a poor requirements set

### Section scores

| Section | Score | Notes |
|---|---|---|
| What it does | ✅/⚠️/❌ | |
| Who uses it | ✅/⚠️/❌ | |
| The problem | ✅/⚠️/❌ | |
| Key features | ✅/⚠️/❌ | |
| Out of scope | ✅/⚠️/❌ | |
| Competitors / alternatives | ✅/⚠️/❌ | |
| Revenue model | ✅/⚠️/❌ | |

### Scope

*(Any vague features, over-scoped MVP, or implicit features not listed)*

### Roles

*(Coverage check — roles defined, features tied to each)*

### Technical flags

*(Anything outside the fixed stack or requiring external integrations)*

### Ambiguities to resolve

1. *(Concrete question)*
2. *(Concrete question)*

### Recommendation

*(One paragraph: what to fix before running /design, or confirmation it's ready to go)*

---
