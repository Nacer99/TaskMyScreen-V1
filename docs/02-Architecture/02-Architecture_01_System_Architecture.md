# SYSTEM ARCHITECTURE

Version: 1.0

Status: APPROVED

Owner: Software Architecture

Applies To:

- Engineering
- Product
- QA
- DevOps
- Gemini Code Assist

---

# 1. Purpose

This document defines the complete software architecture of TaskMyScreen.

It is the reference architecture that every future implementation MUST respect.

Gemini SHALL consult this document before modifying any component.

---

# 2. Architecture Philosophy

TaskMyScreen follows five architectural principles.

1. Single Source of Truth

The backend database is authoritative.

---

2. Event Driven

The application reacts to events.

Examples

Task Created

↓

Notification Scheduled

↓

Notification Fired

↓

Task Completed

↓

Notification Removed

---

3. Layer Separation

Presentation

↓

Business

↓

Infrastructure

↓

Persistence

Each layer has a single responsibility.

---

4. Stateless Backend

The backend owns business rules.

The frontend owns interaction.

The backend MUST NOT depend on browser state.

---

5. Native-Feeling PWA

The application remains a Progressive Web Application while exposing Android-native user experience.

---

# 3. High-Level Architecture

                    User

                      │

             Android Smartphone

                      │

          Progressive Web App (React)

                      │

        ┌─────────────┴─────────────┐

        │                           │

Service Worker              React Application

        │                           │

Notification Engine         UI Components

        │                           │

        └─────────────┬─────────────┘

                      │

                REST API (Express)

                      │

                Business Services

                      │

                 Drizzle ORM

                      │

                 PostgreSQL

                      │

             Authentication (Clerk)

                      │

             Screenshot Storage (AWS S3)

---

# 4. Architectural Layers

Layer 1

Presentation

Responsibilities

React

Pages

Components

Routing

Forms

Animations

Theme

No business logic.

---

Layer 2

Application

Responsibilities

Task orchestration

Notification orchestration

Permissions

State synchronization

API communication

---

Layer 3

Business Domain

Responsibilities

Task lifecycle

Scheduling rules

Premium rules

Validation

Authorization

Domain invariants

---

Layer 4

Infrastructure

Responsibilities

REST API

Storage

Authentication

Notifications

Image upload

External services

---

Layer 5

Persistence

Responsibilities

Database

ORM

Storage

Transactions

---

# 5. System Components

Component

React Application

Purpose

User Interface

Technology

React

---

Component

Wouter

Purpose

Routing

---

Component

React Query

Purpose

Server synchronization

Caching

---

Component

Clerk

Purpose

Authentication

Session Management

---

Component

Express

Purpose

REST API

---

Component

Drizzle ORM

Purpose

Database abstraction

---

Component

PostgreSQL

Purpose

Persistent storage

Single source of truth.

---

Component

AWS S3

Purpose

Screenshot storage

---

Component

Service Worker

Purpose

Notification delivery

Share Target

Offline capabilities

---

Component

Notification Engine

Purpose

Scheduling

Cancellation

Restoration

Action handling

---

# 6. Domain Architecture

The domain is intentionally simple.

User

↓

owns

↓

Tasks

↓

generate

↓

Notifications

↓

trigger

↓

User Actions

↓

update

↓

Task State

---

No component may bypass this lifecycle.

---

# 7. Notification-Centric Architecture

Unlike traditional task applications,

TaskMyScreen revolves around notifications.

Architecture therefore follows this sequence.

Task

↓

Scheduler

↓

Notification

↓

Interaction

↓

Task Update

Every engineering decision must preserve this sequence.

---

# 8. Synchronization Strategy

Server

↓

stores

↓

Task

↓

Frontend downloads

↓

Notification scheduled locally

↓

Service Worker displays reminder

↓

User interacts

↓

Frontend updates server

↓

Notification engine updates schedule

This synchronization cycle must never be broken.

---

# 9. Screenshot Lifecycle

Android Share Sheet

↓

Share Target

↓

Service Worker

↓

Temporary Cache

↓

Task Creation Screen

↓

Upload to AWS S3

↓

Store URL in PostgreSQL

↓

Display inside Notification

↓

Reuse inside Task Detail

Image duplication is forbidden.

Only one canonical image URL exists.

---

# 10. Authentication Flow

User

↓

Clerk Authentication

↓

JWT

↓

Express Middleware

↓

Authenticated Routes

↓

Database

The frontend never trusts itself.

Authentication is always verified server-side.

---

# 11. Reminder Lifecycle

Create Task

↓

Validate

↓

Persist Database

↓

Schedule Notification

↓

Persist Local Queue

↓

Trigger Notification

↓

User Action

↓

Update Task

↓

Update Notification

↓

Persist Database

---

# 12. Premium Flow

User

↓

Plan Detection

↓

Free

or

Pro

↓

Notification Engine

↓

Allowed Actions

↓

UI Rendering

↓

Backend Validation

Premium rights must always be validated on both frontend and backend.

Frontend alone is never sufficient.

---

# 13. Offline Architecture

If the server becomes unavailable:

Existing reminders continue locally.

New reminder creation is blocked until synchronization is possible.

Already scheduled reminders remain operational.

Pending synchronization resumes automatically.

---

# 14. Error Handling Strategy

Errors are classified into four levels.

Level 1

UI Errors

Recover locally.

---

Level 2

API Errors

Retry when appropriate.

Inform the user.

---

Level 3

Synchronization Errors

Retry automatically.

Never lose reminders.

---

Level 4

Critical Errors

Authentication failure

Database corruption

Notification engine failure

Immediately stop affected workflow.

Log diagnostic information.

---

# 15. Component Communication Rules

React Components

↓

Hooks

↓

API Client

↓

REST API

↓

Business Logic

↓

Database

Direct communication skipping layers is forbidden.

Example

Component

↓

Database

❌ Forbidden

Component

↓

Hook

↓

API

↓

Database

✅ Required

---

# 16. Architectural Constraints

The following technologies are architectural decisions and MUST NOT be replaced without an Architecture Decision Record (ADR):

React

TypeScript

Vite

Express

Drizzle ORM

PostgreSQL

Clerk

AWS S3

Service Worker

React Query

Wouter

---

# 17. Scalability Principles

The architecture must support:

Millions of reminders.

Hundreds of thousands of users.

Multiple devices per account.

Future synchronization services.

Future native Android wrapper.

Future Wear OS companion.

No architectural redesign should be required.

---

# 18. Architectural Invariants

The following rules are immutable.

Database is authoritative.

Notifications are projections of tasks.

Service Worker never owns business logic.

Business rules never reside inside UI components.

Authentication always precedes authorization.

Task state determines notification state.

Image URLs are immutable references.

Every scheduled notification corresponds to exactly one task.

---

# 19. Engineering Decision Order

Before implementing any feature Gemini SHALL verify:

Product Vision

↓

Business Rules

↓

Architecture

↓

Database

↓

API

↓

Notification Engine

↓

Service Worker

↓

Frontend

↓

Testing

↓

Documentation

Implementation begins only after all impacted layers are identified.

---

# 20. Definition of Architectural Success

The architecture is considered healthy when:

No duplicated business logic exists.

Every layer has a single responsibility.

Notifications remain deterministic.

Synchronization remains predictable.

Premium rules remain centralized.

The frontend stays lightweight.

The backend remains authoritative.

Future evolution requires extension rather than redesign.

---

END OF DOCUMENT
