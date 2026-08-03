# TaskMyScreen Project Decisions

## Current Version

TaskMyScreen V1

---

# Development Environment

Official IDE:
Cursor

Official Repository:
GitHub

Official Build Platform:
Google Cloud Shell

GitHub is the Source of Truth.

Cloud Shell is the Validation Platform.

---

# Git Strategy

main

Production Branch

develop

Development Branch

All new work starts from develop.

---

# Payment Strategy

Version 1 uses PayPal ONLY.

Stripe will be integrated in Version 2.

All payment services must remain provider-independent.

---

# Notification Philosophy

Notifications are the core product.

Tasks exist only to generate notifications.

---

# Architecture

No backend rewrite.

No architecture redesign.

No migration away from PostgreSQL.

No migration away from Clerk.

No migration away from AWS S3.

---

# Artificial Intelligence

Cursor is the Lead Developer.

The Human validates:

- architecture decisions
- releases
- roadmap evolution

Cursor must always follow:

- GEMINI.md
- PROJECT_STATE.md
- PROJECT_DECISIONS.md
- every document inside docs/

---

# Definition of Done

Every feature must pass:

Architecture Analysis

↓

Implementation

↓

Tests

↓

Regression Analysis

↓

Documentation Update

↓

Git Commit

before being considered complete.
