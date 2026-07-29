# TASKMYSCREEN
# MASTER PROJECT CHARTER

Version: 1.0

Status: FINAL

Authority Level: ABSOLUTE

Applies To

- Gemini Code Assist
- All Developers
- QA
- Future AI Agents
- Product Owner

---

# 1. Purpose

This document is the supreme reference governing every decision made during the development of TaskMyScreen.

All technical, functional and architectural decisions SHALL comply with this charter.

Whenever two documents conflict, this document has the highest priority.

---

# 2. Vision

TaskMyScreen is not a classical task manager.

It is an Android-first productivity assistant whose mission is to make users perform important actions exactly when they intended to perform them.

The application exists to eliminate forgotten tasks through highly personalized reminders.

---

# 3. Product Mission

TaskMyScreen shall become the most reliable Android reminder application by delivering:

• Personalized reminders

• Native Android experience

• Extremely simple user experience

• Reliable scheduling

• Beautiful notification presentation

• Zero unnecessary complexity

The application is reminder-centric.

Tasks only exist to generate reminders.

---

# 4. Core Functional Principle

Every task exists for one purpose:

Generate one personalized reminder.

A reminder contains:

• Task title

• Task description

• User screenshot

• Reminder timestamp

• User actions

There are no standalone reminders.

There are no reminder collections.

There are only Tasks.

---

# 5. Product Identity

TaskMyScreen is:

Android-first

PWA-first

Reminder-first

Offline-friendly

Cloud-synchronized

Freemium

Production-grade

TaskMyScreen is NOT:

A collaborative tool

A project manager

A note-taking application

A messaging platform

A social application

---

# 6. Strategic Principles

Every evolution shall reinforce:

Reliability

Simplicity

Maintainability

Performance

Determinism

Native Android feeling

Scalability

Security

Every feature that weakens these principles shall be rejected.

---

# 7. Product Pillars

Pillar 1

Create reminders in seconds.

Pillar 2

Deliver reminders exactly on time.

Pillar 3

Allow premium users to intelligently postpone reminders.

Pillar 4

Provide a premium Android experience.

---

# 8. Official Business Rules

Rule 1

One Task generates one Reminder.

Rule 2

Reminder time is chosen by the user.

Rule 3

The reminder always displays:

Task title

Task description

Task screenshot

Rule 4

Notification opens the associated task.

Rule 5

Premium users may reschedule reminders.

Rule 6

Free users cannot reschedule.

Rule 7

Premium users have unlimited reminders.

Rule 8

Free users are limited to 20 reminders per month.

Rule 9

Notification scheduling is deterministic.

Rule 10

No duplicate reminders may exist.

---

# 9. Premium Differentiation

FREE

20 reminders/month

No rescheduling

Basic notification actions

PRO

Unlimited reminders

15 min Snooze

30 min Snooze

1 hour Snooze

Custom Reschedule

Future premium capabilities shall never degrade the Free experience.

---

# 10. Technical Principles

Architecture must remain:

Layered

Modular

Deterministic

Strongly typed

Documented

Testable

Maintainable

Business logic remains centralized.

---

# 11. Technology Stack

Frontend

React

Vite

TypeScript

TanStack Query

Wouter

Backend

Express

Drizzle ORM

PostgreSQL

Authentication

Clerk

Payments

Stripe

Storage

AWS S3-compatible bucket

Notifications

Service Worker

Android Notification API

PWA APIs

Development Platform

Google Cloud Shell

Gemini Code Assist

GitHub

---

# 12. Non-Negotiable Constraints

No duplicated business logic.

No undocumented architecture.

No hidden business rules.

No direct database access from UI.

No business logic inside React components.

No notification entity.

No push notification provider.

No Firebase Cloud Messaging dependency.

No browser-generated unsubscribe button.

---

# 13. Engineering Principles

Every implementation shall be:

Small

Readable

Reusable

Predictable

Secure

Incremental

Backward compatible

Architecture always wins over shortcuts.

---

# 14. Quality Philosophy

Every feature must satisfy:

Architecture compliance

Business compliance

Regression safety

Documentation completeness

Production readiness

Quality is mandatory.

---

# 15. AI Governance

Gemini Code Assist acts as:

Software Architect

Senior Full Stack Engineer

Code Reviewer

QA Engineer

Technical Writer

Gemini shall:

Understand before coding.

Review before delivering.

Document before closing.

Never guess requirements.

---

# 16. Documentation Hierarchy

Priority order:

MASTER_PROJECT_CHARTER

↓

Business Requirements

↓

Architecture Documents

↓

Implementation Protocol

↓

QA Documentation

↓

Source Code

Documentation is authoritative.

---

# 17. Definition of Success

TaskMyScreen is considered successful when:

Every reminder is delivered reliably.

Every premium rule behaves correctly.

The Android experience feels native.

The codebase remains clean.

The architecture scales naturally.

Gemini can continue development autonomously without architectural drift.

---

# 18. Long-Term Objective

The architecture shall support future expansion without redesign, including:

Wear OS integration

AI-generated reminder suggestions

Voice reminder creation

Calendar synchronization

Widgets

Cross-device synchronization

Smart reminder prioritization

These future capabilities shall integrate into the existing architecture without violating the principles defined in this charter.

---

# FINAL DIRECTIVE TO GEMINI CODE ASSIST

You are not writing isolated code.

You are engineering a production-grade software product.

Every decision shall preserve:

Business intent.

Architectural integrity.

Maintainability.

Reliability.

Scalability.

Security.

Deterministic behavior.

If an implementation compromises one of these principles, it shall be rejected and redesigned.

The long-term health of the codebase always has priority over implementation speed.

---

END OF MASTER PROJECT CHARTER
