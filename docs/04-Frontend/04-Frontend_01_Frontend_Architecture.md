# FRONTEND ARCHITECTURE

Version: 1.0

Status: APPROVED

Criticality: CRITICAL

Owner: Software Architecture

Applies To

- React Application
- UI Layer
- PWA Layer
- Android Native Features
- Gemini Code Assist
- QA

---

# 1. Purpose

The Frontend is responsible for presenting the TaskMyScreen user experience.

It is NOT responsible for business decisions.

It is NOT the source of truth.

Its mission is to transform backend business state into a fast, intuitive and native-like Android experience.

---

# 2. Core Principles

The frontend SHALL follow the following principles:

Single Responsibility

Predictable State

Deterministic Rendering

Offline-first UX

Mobile-first Design

Native Android Feel

Accessibility

Performance

Every React component must have exactly one responsibility.

---

# 3. Frontend Responsibilities

The frontend owns:

Authentication Screens

Navigation

Task Forms

Task Visualization

Notification Permission

Local Scheduling

Service Worker Communication

Animation

UI State

Offline Experience

Image Preview

Theme

Responsive Layout

The frontend never owns business rules.

---

# 4. Architectural Layers

```
Presentation Layer

        │

Components

        │

Hooks

        │

Application Services

        │

API Client

        │

REST Backend
```

Each layer communicates only with adjacent layers.

---

# 5. Presentation Layer

Responsibilities

Render data.

Collect user input.

Display loading.

Display errors.

Display empty states.

Never call the database.

Never contain business logic.

---

# 6. Component Layer

Components are reusable.

Examples

TaskCard

TaskList

ReminderBadge

UploadImage

NotificationBanner

PlanCard

ProgressBar

FloatingActionButton

Each component receives data.

Each component renders data.

Nothing more.

---

# 7. Hook Layer

Hooks coordinate frontend behavior.

Examples

usePlan()

useRestoreNotifications()

useSwMessages()

useNotificationPermission()

useTaskFilters()

useTaskStatistics()

Hooks may orchestrate logic.

Hooks never contain business rules.

---

# 8. Service Layer

Responsibilities

Notification scheduling.

Notification cancellation.

Image upload.

Service Worker messaging.

Browser APIs.

PWA APIs.

Every browser API belongs here.

---

# 9. API Layer

The API layer communicates exclusively with the backend.

Responsibilities

GET Tasks

POST Task

PATCH Task

DELETE Task

Statistics

Authentication

No React component performs HTTP requests directly.

---

# 10. Navigation

Navigation uses Wouter.

Primary routes

/

Home

/sign-in

/sign-up

/tasks

/tasks/new

/tasks/:id/edit

/upgrade

/notify-test

Future routes

/settings

/profile

/history

/analytics

/help

Navigation must remain centralized.

---

# 11. Authentication

Authentication uses Clerk.

Responsibilities

Login

Logout

Registration

Session

Identity

Protected Routes

Frontend SHALL NEVER verify JWTs manually.

---

# 12. State Management

State hierarchy

React Local State

↓

TanStack Query

↓

Browser APIs

↓

Backend

Business data always originates from the backend.

---

# 13. TanStack Query

Owns

Caching

Refetching

Synchronization

Optimistic Updates (future)

Retry Logic

Offline recovery

Never duplicate cached business state elsewhere.

---

# 14. Local State

Local state stores only:

Modal visibility

Selected tab

Current animation

Current upload

Current form values

Search text

Never business persistence.

---

# 15. Forms

Every form SHALL use

React Hook Form

Zod Validation

Controlled Submission

Validation occurs

Client

↓

Backend

Both must agree.

---

# 16. Task Screen

Responsibilities

Display tasks.

Filter tasks.

Navigate.

Request notification permission.

Display quota.

Display premium upgrade.

Never schedule notifications directly.

Scheduling belongs to Notification Service.

---

# 17. Task Form

Responsibilities

Create task.

Edit task.

Upload screenshot.

Pick reminder time.

Preview notification.

Never write directly into localStorage.

---

# 18. Image Upload

Workflow

Android Share

↓

Temporary Cache

↓

Preview

↓

Upload

↓

AWS

↓

Receive URL

↓

Persist Task

The browser never stores permanent image copies.

---

# 19. Notification Permission

Permission is requested only when needed.

Workflow

User creates first reminder

↓

Permission Request

↓

Accepted

↓

Notification Scheduling

Permission denial never crashes the application.

---

# 20. Notification Flow

Create Task

↓

API

↓

Database

↓

Notification Service

↓

Service Worker

↓

Android Notification

↓

User Action

↓

Backend Update

The UI reflects state.

It never creates business state.

---

# 21. Offline Behavior

Supported

Navigation

Previously loaded tasks

Pending schedules

Service Worker

Cached assets

Not supported

Authentication

Synchronization

Cloud uploads

Stripe

---

# 22. Loading States

Every asynchronous action SHALL expose

Loading

Success

Failure

Retry

Skeletons are preferred over spinners.

---

# 23. Error Handling

Every page handles

API failure

Offline mode

Timeout

Permission denial

Unexpected error

Errors must be recoverable whenever possible.

---

# 24. Accessibility

Minimum requirements

Keyboard navigation

ARIA labels

Color contrast

Screen reader compatibility

Visible focus indicators

Accessibility is mandatory.

---

# 25. Responsive Design

Primary target

Android phones

Secondary

Tablets

Desktop

Desktop remains functional but mobile-first.

---

# 26. Performance Targets

Initial Load

<2 seconds

Route Change

<100 ms

Task List Render

<50 ms

Image Preview

Immediate

Notification Scheduling

<100 ms

---

# 27. Engineering Constraints

Gemini MUST NOT

Place business rules inside React.

Call APIs from UI components.

Duplicate API data.

Store business state in Context.

Schedule notifications from UI components.

Use localStorage as the source of truth.

Duplicate backend validation.

---

# 28. Folder Organization

```
src/

components/

pages/

hooks/

services/

lib/

assets/

styles/

providers/

utils/
```

Every folder owns one responsibility.

---

# 29. Future Evolution

The frontend architecture SHALL support

Widgets

Wear OS companion

Voice reminders

AI assistant

Multi-language

Dark mode improvements

Tablet optimization

Without architectural redesign.

---

# 30. Definition of Success

The frontend is compliant when

Business logic remains outside React.

Every screen is deterministic.

Every component has one responsibility.

API communication is centralized.

The Android experience feels native.

The application remains maintainable, testable and scalable.

---

END OF DOCUMENT
