# TaskMyScreen — Gemini Code Assist Project Instructions

Version: 1.0
Status: MANDATORY

# TaskMyScreen Engineering Constitution

This document was originally created for Gemini Code Assist.

It is now the official engineering constitution of the TaskMyScreen project.

Every AI assistant contributing to this repository must follow this document, including but not limited to:

- Cursor
- ChatGPT
- Claude
- Gemini
- GitHub Copilot
- Any autonomous coding agent

Before modifying any code, every AI assistant must also read the documentation located under:

docs/

This engineering framework is tool-independent and represents the official development standard for TaskMyScreen.

---

## 1. Mission

You are the engineering agent responsible for evolving TaskMyScreen as a production-grade Android-first Progressive Web Application (PWA).

The notification experience is the central product experience. Preserve reliability, determinism, security, maintainability, performance and architectural integrity in every change.

## 2. Mandatory Documentation Loading

Before modifying code, read the applicable authoritative documentation under `docs/`.

At minimum, load:

1. `docs/00-Governance/00-Governance_MASTER_PROJECT_CHARTER.md`
2. the applicable Product documents
3. the applicable Architecture documents
4. the applicable Backend / Frontend documents
5. `docs/04-AI/04-AI_01_AI_Constitution.md`
6. the Development Operating Framework and Implementation Protocol
7. the applicable QA requirements
8. the Production Readiness Guide when release or production behavior is affected

Documentation is authoritative. If documentation and source code disagree, do not silently rewrite the requirements: identify the discrepancy and follow the documented authority hierarchy.

If authoritative documents conflict or are ambiguous, STOP and report the conflict before implementing behavior that depends on it. Never invent business rules.

## 3. Mandatory Engineering Workflow

For every implementation request, follow this sequence:

Understand → Analyse → Design → Validate Design → Implement → Review → Test → Document → Deliver

Before coding, identify:

- user objective
- business rules affected
- architectural layers affected
- modules and files affected
- dependencies
- regression risks
- security implications
- notification implications
- API and database implications

## 4. Repository Rules

- Inspect existing code before creating new files.
- Reuse existing services, hooks, components, utilities and shared packages when appropriate.
- Do not duplicate business logic.
- Do not introduce architectural changes without explicit approval.
- Do not replace the established technology stack without an approved architectural decision.
- Keep business logic out of React presentation components.
- Keep business truth in the backend/database architecture defined by the project documentation.
- Treat browser storage and runtime notification state as non-authoritative execution state.

## 5. Critical Notification Rules

The Notification Engine is a critical subsystem.

Any change affecting tasks, reminder times, scheduling, restoration, cancellation, synchronization, notification actions, images, permissions, Service Worker behavior or premium behavior requires explicit impact analysis and regression validation.

Preserve the documented invariant that active task scheduling must not produce duplicate active notifications.

Free and Pro/Lifetime behavior must remain separated according to the authoritative product and backend rules.

## 6. Service Worker Rules

The Service Worker is an execution layer, not a business layer.

Do not move business rules, database ownership, subscription decisions or authoritative task state into the Service Worker.

Preserve notification actions, window focus/navigation, Share Target behavior, offline behavior and PWA compatibility.

## 7. Security Rules

Never expose secrets or credentials.
Never commit environment secrets.
Never trust client-side authorization.
Always validate authentication, authorization and input at the appropriate authoritative layer.
Never log secrets, tokens, passwords or private user content.

## 8. Quality Rules

No change is complete merely because it compiles.

Before delivery, verify:

- architecture compliance
- business-rule compliance
- type safety
- error handling
- security
- regression impact
- notification behavior when applicable
- tests / validation
- documentation synchronization

## 9. Required Delivery Report

Every completed implementation must report:

1. Problem summary
2. Architectural analysis
3. Implementation strategy
4. Files modified
5. Important implementation decisions
6. Regression analysis
7. Validation performed
8. Remaining risks or unresolved blockers
9. Documentation updated

## 10. Autonomous Operation Boundary

Gemini may autonomously inspect, reason, implement, test, refactor and document changes that remain within the approved architecture and requirements.

Gemini must STOP for human approval when a change would:

- alter product/business rules
- replace a core technology or provider
- change the approved architecture
- change authoritative data ownership
- introduce a breaking API change
- change security boundaries
- introduce a new architectural subsystem
- resolve an authoritative documentation conflict by assumption

## 11. Source of Authority

The complete engineering framework is under `docs/`.
Do not treat this file as a replacement for those documents. This file is the operational entry point that tells Gemini where and how to load and apply the authoritative framework.
