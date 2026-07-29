# BACKEND ARCHITECTURE & API CONTRACT

Version: 1.0

Status: APPROVED

Criticality: CRITICAL

Owner: Software Architecture

Applies To

- Backend
- API
- Database
- Authentication
- Gemini Code Assist
- QA

---

# 1. Purpose

The Backend is the authoritative source of truth for TaskMyScreen.

Every business decision originates from the Backend.

No frontend component, Service Worker or browser storage may override backend decisions.

---

# 2. Architectural Principles

The backend SHALL follow a strict layered architecture.

```
                Client

                  │

             REST API

                  │

      Authentication Layer

                  │

        Validation Layer

                  │

        Business Services

                  │

        Repository Layer

                  │

             PostgreSQL
```

Each layer owns one responsibility only.

---

# 3. Responsibilities

The Backend owns:

Authentication

Authorization

Business Rules

Task Persistence

Subscription Validation

Notification Scheduling Requests

Quota Validation

Synchronization

Data Integrity

Auditability

The Backend never owns UI.

---

# 4. Technology Stack

Runtime

Node.js

Language

TypeScript

Framework

Express

Validation

Zod

ORM

Drizzle ORM

Database

PostgreSQL

Authentication

Clerk

Payments

Stripe

Image Storage

AWS S3 compatible storage

Logging

Pino

---

# 5. Architectural Layers

Layer 1

Routing

Receives HTTP requests.

Never contains business logic.

---

Layer 2

Authentication

Resolves authenticated user.

Rejects anonymous requests.

---

Layer 3

Validation

Validates request body.

Validates parameters.

Validates query string.

Rejects malformed requests.

---

Layer 4

Business Services

Implements business rules.

Coordinates repositories.

Generates domain events.

---

Layer 5

Repository

Reads database.

Writes database.

No business rules allowed.

---

# 6. Authentication Rules

Authentication is mandatory.

All authenticated requests use Clerk.

Every request resolves:

User ID

Subscription

Identity

No endpoint trusts frontend identity.

---

# 7. Authorization Rules

A user can only access:

Own Tasks

Own Statistics

Own Subscription

Any attempt to access another user's data SHALL return:

HTTP 404

or

HTTP 403

depending on security policy.

---

# 8. Task Aggregate

The Task is the aggregate root.

Every mutation passes through Task.

Notifications are derived objects.

The API never manipulates notifications directly.

---

# 9. API Design Principles

RESTful

Stateless

Deterministic

Idempotent where applicable

Versionable

Predictable

---

# 10. Endpoint Catalogue

Current endpoints

GET /tasks

POST /tasks

PATCH /tasks/{id}

Future

DELETE /tasks/{id}

GET /tasks/{id}

GET /stats

POST /notifications/test

POST /subscriptions/webhook

POST /share/upload

---

# 11. GET /tasks

Purpose

Return authenticated user's tasks.

Input

Authenticated request.

Output

Task collection.

Rules

Never returns another user's tasks.

Supports future filtering.

Supports pagination.

Supports sorting.

---

# 12. POST /tasks

Purpose

Create reminder.

Workflow

Authenticate

↓

Validate

↓

Verify quota

↓

Persist

↓

Generate event

↓

Return resource

Rules

Creation must be atomic.

---

# 13. PATCH /tasks/{id}

Purpose

Update existing task.

Supported operations

Edit title

Edit description

Edit reminder time

Attach image

Complete task

Reschedule reminder

Rules

Only owner can update.

---

# 14. DELETE /tasks/{id}

Future endpoint.

Workflow

Authenticate

↓

Verify ownership

↓

Delete task

↓

Cancel notification

↓

Return success

Deletion must be idempotent.

---

# 15. Statistics Endpoint

Purpose

Provide dashboard information.

Fields

Plan

Monthly usage

Remaining quota

Pending tasks

Completed tasks

Future analytics

---

# 16. Validation Rules

Title

Required

1–150 characters

Description

Optional

Maximum length configurable

Reminder Time

Required

Valid ISO date

Future timestamp

Image URL

Optional

Valid URL

---

# 17. Business Rules

Free users

Maximum monthly reminders

Cannot use premium notification actions

Cannot custom reschedule

Cannot quick reschedule

---

Pro users

Unlimited reminders

Quick Snooze

Quick Reschedule

Custom Reschedule

Future premium features

---

Lifetime

Equivalent to Pro

Without expiration

---

# 18. Error Model

Every error follows identical schema.

```
{
  success: false,
  code: "...",
  message: "...",
  details: {...}
}
```

Errors are deterministic.

No HTML responses.

---

# 19. HTTP Status Codes

200

Success

201

Created

204

Deleted

400

Validation error

401

Unauthenticated

403

Forbidden

404

Resource not found

409

Business conflict

422

Semantic validation

429

Rate limit

500

Unexpected server error

---

# 20. Idempotency Rules

GET

Always idempotent

PATCH

Idempotent

DELETE

Idempotent

POST

Non-idempotent unless explicit key supplied.

---

# 21. Database Transactions

Every write operation SHALL execute inside a transaction when multiple entities are modified.

Partial updates are forbidden.

---

# 22. Event Generation

Successful operations generate domain events.

TaskCreated

TaskUpdated

TaskCompleted

TaskDeleted

ReminderRescheduled

SubscriptionChanged

Events remain internal.

---

# 23. Logging Policy

Every request logs:

Timestamp

Route

Latency

HTTP status

Authenticated user ID

Correlation ID

Never log:

Secrets

Tokens

Passwords

Image binaries

Personal notification content

---

# 24. Observability

Metrics

Average latency

Request count

Error rate

Database latency

Validation failures

Authentication failures

Quota violations

---

# 25. Security Rules

Every endpoint validates:

Authentication

Ownership

Input

Business permissions

Rate limits

Never trust frontend values.

---

# 26. Performance Targets

GET Tasks

<100 ms

Create Task

<150 ms

Update Task

<150 ms

Delete Task

<150 ms

Statistics

<80 ms

---

# 27. Future Compatibility

The backend SHALL support:

Recurring reminders

Folders

Tags

Task history

Wear OS

Widgets

AI reminder suggestions

Calendar integrations

Without breaking existing APIs.

---

# 28. Engineering Constraints

Gemini MUST NOT:

Place business logic in Express routes.

Duplicate validation.

Query database directly from React.

Expose internal identifiers.

Trust browser storage.

Implement subscription logic client-side.

Use localStorage as business persistence.

---

# 29. Definition of Done

A backend feature is considered complete only when:

Business rules implemented.

Validation complete.

Authorization enforced.

Unit tests passing.

Integration tests passing.

Logs implemented.

API documented.

No duplicated logic.

---

# 30. Definition of Success

The Backend is compliant when:

Every request is deterministic.

Business rules exist only once.

Database integrity is preserved.

Authentication cannot be bypassed.

Premium features cannot be abused.

The Backend remains the single authoritative source of truth.

---

END OF DOCUMENT
