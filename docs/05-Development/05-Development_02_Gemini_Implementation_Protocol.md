# GEMINI IMPLEMENTATION PROTOCOL

Version: 1.0

Status: MANDATORY

Criticality: MAXIMUM

Owner

Chief Software Architect

Applies To

- Gemini Code Assist
- Human Developers
- CI/CD Pipeline
- QA
- Technical Review

---

# 1. Purpose

This document defines the mandatory implementation protocol that Gemini Code Assist SHALL follow before, during and after every modification of the TaskMyScreen codebase.

Its objective is to make Gemini behave like a Senior Technical Lead responsible for a production-grade application.

Every generated line of code shall follow this protocol.

---

# 2. Golden Rule

Gemini SHALL NEVER write code immediately.

Implementation always starts with analysis.

The mandatory sequence is:

Understand

↓

Analyse

↓

Design

↓

Validate Design

↓

Implement

↓

Review

↓

Test

↓

Document

↓

Deliver

---

# 3. Understanding Phase

Before implementing any request Gemini SHALL identify:

The user's objective.

The impacted business rule.

The impacted architectural layer.

The impacted modules.

The dependencies.

The possible regressions.

No implementation begins before this analysis is complete.

---

# 4. Context Loading

Before writing code Gemini SHALL load the following context:

Business documentation

Architecture documentation

Current source files

API contracts

Database schema

Notification Engine specification

Relevant Service Worker logic

React components

Existing tests

The objective is to avoid isolated reasoning.

---

# 5. Requirement Analysis

Gemini SHALL classify every request.

Possible categories

New Feature

Bug Fix

Refactoring

Performance

Security

Documentation

Testing

Infrastructure

Architecture

Migration

Different categories require different implementation strategies.

---

# 6. Impact Analysis

Gemini SHALL identify all impacted modules.

Minimum analysis includes:

Frontend

Backend

Database

Notification Engine

Service Worker

Authentication

Storage

API

Hooks

Shared Types

No modification is considered isolated.

---

# 7. Business Rule Validation

Before implementation Gemini SHALL verify:

Does this request violate an existing business rule?

Does it modify premium behavior?

Does it affect reminders?

Does it affect notifications?

Does it affect synchronization?

If yes,

the architecture documents must be consulted first.

---

# 8. Architectural Validation

Every solution SHALL satisfy:

Single Responsibility

Layer Separation

No Circular Dependencies

Deterministic Behavior

Stateless Components

Predictable Data Flow

Architecture has priority over implementation speed.

---

# 9. Code Reuse Strategy

Gemini SHALL search for reusable elements before creating new ones.

Priority order

Existing Service

↓

Existing Hook

↓

Existing Component

↓

Existing Utility

↓

Shared Package

↓

New Implementation

Creating duplicate functionality is prohibited.

---

# 10. File Creation Policy

New files are created only when one of the following is true:

Single Responsibility requires it.

Maintainability improves.

Architecture becomes clearer.

Testing becomes easier.

Otherwise,

existing files shall be extended.

---

# 11. API Modification Policy

Whenever an endpoint changes,

Gemini SHALL verify:

Frontend compatibility

Type definitions

Validation schemas

Authentication

Authorization

Notification Engine

Regression risks

Breaking changes require explicit justification.

---

# 12. Database Modification Policy

Schema evolution requires:

Migration

Backward compatibility

Data integrity

Rollback strategy

Migration documentation

Production safety

No schema changes without migration.

---

# 13. Notification Engine Policy

Every reminder modification requires verification of:

Scheduling

Cancellation

Restoration

Synchronization

Premium actions

Notification uniqueness

Notification timing

The Notification Engine is treated as a critical subsystem.

---

# 14. Service Worker Policy

Every modification SHALL preserve:

Android Share Target

Notification actions

Window focus

Offline behavior

PWA compatibility

Background execution

The Service Worker remains lightweight.

---

# 15. Performance Checklist

Before accepting code Gemini SHALL verify:

Rendering cost

Network requests

Database queries

Memory allocations

Bundle size

Cache usage

Lazy loading opportunities

Performance regressions are unacceptable.

---

# 16. Security Checklist

Every implementation validates:

Authentication

Authorization

Input validation

Output sanitization

Secret handling

Access control

Permission boundaries

Security is never optional.

---

# 17. Error Handling Policy

Every asynchronous operation SHALL provide:

Success path

Failure path

Timeout handling

Retry strategy (where appropriate)

Meaningful logging

Graceful recovery

Silent failures are forbidden.

---

# 18. Naming Rules

Names SHALL be:

Explicit

Business-oriented

Predictable

Consistent

Avoid abbreviations.

Avoid generic names.

Prefer business vocabulary.

---

# 19. Complexity Rules

Maximum function size

≈ 40 logical lines

Maximum component size

≈ 300 lines

Maximum nesting depth

3 levels

Cyclomatic complexity should remain low.

Complexity shall be reduced continuously.

---

# 20. Refactoring Policy

Gemini SHALL continuously improve:

Naming

Readability

Modularity

Consistency

Dead code removal

Dependency reduction

Refactoring shall preserve behavior.

---

# 21. Review Checklist

Before considering implementation complete,

Gemini SHALL verify:

Architecture respected

Business rules respected

Code duplication absent

Performance acceptable

Security acceptable

Types complete

Documentation updated

Regression risks analyzed

---

# 22. Testing Checklist

For every implementation Gemini SHALL mentally validate:

Happy path

Validation failures

Authentication failures

Authorization failures

Network failures

Offline mode

Notification scheduling

Notification restoration

Premium behavior

Free behavior

Regression scenarios

---

# 23. Documentation Policy

Every significant implementation updates:

Architecture

API documentation

Developer documentation

Migration notes

Technical decisions

Documentation is treated as source code.

---

# 24. Delivery Format

Every implementation delivered by Gemini SHALL include:

Problem summary

Architectural analysis

Implementation strategy

Files modified

Reasoning

Regression analysis

Validation checklist

Remaining risks

Code without explanation is not acceptable.

---

# 25. Continuous Improvement

Gemini SHALL continuously detect:

Technical debt

Architecture violations

Duplicated logic

Unused code

Unsafe code

Inconsistent naming

Outdated documentation

Suggestions shall be evidence-based.

---

# 26. Forbidden Behaviors

Gemini MUST NEVER:

Implement before understanding.

Ignore architecture.

Invent requirements.

Duplicate business logic.

Create hidden side effects.

Mix presentation with business rules.

Bypass validation.

Bypass authentication.

Generate speculative code.

---

# 27. Definition of Ready

A task is ready for implementation only if:

Requirements are understood.

Business rules identified.

Architecture reviewed.

Impacted modules identified.

Risks evaluated.

Implementation strategy defined.

---

# 28. Definition of Done

A task is complete only if:

Implementation finished.

Architecture preserved.

Business rules preserved.

Regression analysis completed.

Documentation updated.

No critical issue remains unresolved.

---

# 29. Quality Gate

Before final delivery Gemini SHALL ask internally:

Would this implementation be accepted in a senior engineering review at Google, Meta or Stripe?

If the answer is not unequivocally yes,

the implementation shall be revised.

---

# 30. Success Criteria

This protocol is successful when every implementation is:

Deterministic.

Maintainable.

Architecturally coherent.

Fully documented.

Regression-safe.

Production-ready.

Every code generation performed by Gemini shall comply with this protocol.

---

END OF DOCUMENT
