# SERVICE WORKER ARCHITECTURE

Version: 1.0

Status: APPROVED

Criticality: CRITICAL

Owner: Software Architecture

Applies To:

- Frontend
- Notification Engine
- Android Integration
- QA
- Gemini Code Assist

---

# 1. Purpose

This document specifies the architecture, responsibilities, constraints and lifecycle of the TaskMyScreen Service Worker.

The Service Worker is the runtime responsible for delivering the Android-like experience of TaskMyScreen.

It is NOT a business layer.

It is NOT a persistence layer.

It is an execution layer.

---

# 2. Mission

The Service Worker SHALL provide native-like Android capabilities while remaining fully compliant with Progressive Web Application standards.

Its objectives are:

• Notification delivery

• Notification interaction

• Share Target support

• Background execution

• Offline execution

• Native-like behavior

---

# 3. Design Philosophy

The Service Worker must remain extremely small.

Its role is execution.

Never decision making.

Business decisions always belong to the backend or the Notification Engine.

---

# 4. Responsibilities

The Service Worker owns only the following responsibilities.

Notification Display

Notification Click Handling

Notification Action Dispatching

Android Share Target

Client Communication

Offline Asset Caching

Background Event Processing

Window Focus

Navigation Requests

Nothing else.

---

# 5. Explicit Non-Responsibilities

The Service Worker MUST NOT:

Store business state

Validate permissions

Determine Premium rights

Calculate schedules

Read the database

Modify business rules

Authenticate users

Upload screenshots

Generate notifications autonomously

These responsibilities belong elsewhere.

---

# 6. Architectural Position

                     Browser

                        │

                Service Worker

          ┌─────────────┼─────────────┐

          │             │             │

 Notifications   Share Target   Offline Cache

          │             │             │

          └─────────────┼─────────────┘

                        │

                 React Application

                        │

                  Notification Engine

                        │

                     REST API

                        │

                   PostgreSQL

---

# 7. Runtime Lifecycle

Installation

↓

Activation

↓

Claim Clients

↓

Idle

↓

Receive Events

↓

Execute

↓

Return Idle

The Service Worker is event-driven.

It never runs continuously.

---

# 8. Event Model

The Service Worker reacts only to browser events.

Supported events:

install

activate

fetch

message

notificationclick

notificationclose

push (reserved)

sync (future)

periodicsync (future)

Background Fetch (future)

---

# 9. Installation Phase

Objectives

Install immediately.

Skip waiting.

Prepare runtime.

The installation MUST NOT:

Download user data.

Schedule reminders.

Authenticate.

Initialize business state.

---

# 10. Activation Phase

Objectives

Become immediately active.

Claim all browser clients.

Prepare communication.

No business logic executes here.

---

# 11. Fetch Event

Supported responsibilities:

Android Share Target

Offline assets

Future caching strategy

The Service Worker SHALL ignore unrelated requests.

---

# 12. Notification Display

Notification rendering is delegated by the Notification Engine.

The Service Worker SHALL display exactly what it receives.

It SHALL NOT modify:

Title

Body

Image

Reminder Time

Premium Actions

Business Data

Rendering only.

---

# 13. Notification Components

Every notification contains:

Application Icon

Badge

Title

Description

Optional Screenshot

Action Buttons

Internal Metadata

Deep Link

Notification Tag

The rendering order must remain consistent.

---

# 14. Notification Metadata

The notification payload SHALL include:

Notification ID

Task ID

Plan

Screenshot URL

Navigation URL

Creation Timestamp

Reminder Timestamp

Future Extension Fields

Metadata must never contain secrets.

---

# 15. Notification Actions

FREE

Open Task

Mark Done

PRO

Open Task

Mark Done

Snooze

Quick Reschedule

Custom Reschedule

The Service Worker dispatches actions.

It does not execute business logic.

---

# 16. Client Communication

Communication occurs using postMessage.

Service Worker

↓

React Application

↓

Notification Engine

↓

API

↓

Database

The Service Worker never communicates directly with PostgreSQL.

---

# 17. Window Management

When a notification is clicked:

Existing application window

↓

Focus

↓

Navigate

↓

Open target task

If no application window exists:

Open new application window.

Only one application window should become active.

---

# 18. Share Target Architecture

Android Share Sheet

↓

Service Worker

↓

Temporary Cache

↓

Redirect

↓

Task Creation Page

↓

Upload Image

↓

Persist AWS

↓

Create Task

The Share Target never uploads directly.

---

# 19. Temporary Cache

The temporary cache stores:

Shared Screenshot

Filename

Content Type

Nothing else.

The cache is temporary.

It is deleted after successful task creation.

---

# 20. Offline Strategy

Offline mode supports:

Previously installed application

Existing assets

Previously scheduled reminders

Notification interactions

Offline mode does NOT support:

Authentication

Cloud synchronization

Image upload

Premium verification

---

# 21. Security Model

The Service Worker is considered untrusted.

Every incoming event must be validated.

The Service Worker MUST NEVER:

Assume Premium status

Trust incoming messages

Store authentication tokens

Store API secrets

Execute privileged operations

---

# 22. Performance Requirements

Installation

< 500 ms

Activation

< 200 ms

Notification Click

Immediate

Share Target Redirect

< 1 second

Window Focus

Immediate

Memory footprint

Minimal

---

# 23. Reliability Requirements

The Service Worker SHALL survive:

Application restart

Browser restart

Multiple tabs

Background execution

Device sleep

Temporary connectivity loss

Unexpected browser refresh

---

# 24. Error Handling

Recoverable Errors

Cache unavailable

Notification image missing

Window already closed

Recover automatically.

Critical Errors

Registration failure

Execution failure

Browser incompatibility

Log diagnostic information.

Never crash the application.

---

# 25. Logging

Allowed logs:

Installation

Activation

Notification Display

Notification Click

Notification Close

Share Target

Cache Operations

Unexpected Errors

Logs SHALL NEVER include:

Email

Authentication Tokens

Screenshot Binary

Personal Information

---

# 26. Future Extensions

The Service Worker architecture SHALL support:

Background Sync

Periodic Sync

Offline Database

Push Notifications

Wear OS Companion

Android Widgets

Background Image Optimization

Without architectural redesign.

---

# 27. Engineering Constraints

Gemini MUST NOT:

Move business logic into the Service Worker.

Duplicate Notification Engine logic.

Duplicate backend validation.

Store business state.

Create timers inside the Service Worker.

Replace browser events.

Modify browser lifecycle.

Bypass React communication.

---

# 28. Architectural Invariants

The Service Worker remains stateless.

The Service Worker never becomes the source of truth.

The Service Worker never owns scheduling.

The Service Worker never owns subscriptions.

The Service Worker never owns tasks.

The Service Worker executes.

Nothing more.

---

# 29. Service Worker Contract

The Service Worker accepts:

Validated Notification

↓

Displays Notification

↓

Captures User Action

↓

Dispatches Event

↓

Returns Control

This contract is immutable.

---

# 30. Definition of Success

The Service Worker is considered compliant when:

Notifications display correctly.

Android Share Target always works.

Notification actions always reach the application.

Application windows always focus correctly.

Offline execution remains functional.

No business logic exists inside the Service Worker.

The Service Worker remains lightweight, deterministic and replaceable without affecting the business domain.

---

END OF DOCUMENT
