# NOTIFICATION ENGINE SPECIFICATION

Version: 1.0

Status: APPROVED

Owner: Software Architecture

Criticality: CRITICAL

Applies To:

- Frontend
- Backend
- Service Worker
- QA
- Gemini Code Assist

---

# 1. Purpose

The Notification Engine is the heart of TaskMyScreen.

Its responsibility is to transform future tasks into reliable, contextual and actionable Android notifications.

Everything else in the application exists to support this subsystem.

This document is the authoritative specification of the Notification Engine.

---

# 2. Mission

The Notification Engine SHALL guarantee that every valid task produces exactly one personalized notification at the exact date and time selected by the user.

It SHALL guarantee:

• Reliability

• Determinism

• Recoverability

• Synchronization

• Personalization

---

# 3. Responsibilities

The Notification Engine owns:

Notification scheduling

Notification cancellation

Notification restoration

Notification synchronization

Notification personalization

Notification action dispatching

Notification lifecycle

Notification persistence (execution state)

It does NOT own:

Business rules

Authentication

Database persistence

Image upload

Subscription management

---

# 4. Architectural Position

                Task

                  │

                  ▼

      Notification Engine

                  │

      ┌───────────┴───────────┐

      ▼                       ▼

 Local Scheduler       Service Worker

      │                       │

      └───────────┬───────────┘

                  ▼

      Android Notification

                  ▼

          User Interaction

                  ▼

            Application API

---

# 5. Inputs

The Notification Engine receives only validated tasks.

Required fields:

Task ID

Title

Reminder Time

User Plan

Optional fields:

Description

Screenshot URL

---

# 6. Outputs

The engine produces:

Scheduled Notification

Notification Metadata

Notification Actions

Notification Restoration Entry

Synchronization Event

---

# 7. Notification Structure

Every notification SHALL contain:

Title

Description

Task Identifier

Reminder Timestamp

Notification Identifier

Plan Information

Optional Screenshot

Application Deep Link

No notification may be created without a Task ID.

---

# 8. Notification Personalization

The notification SHALL display:

Task title

Task description

Uploaded screenshot (if available)

Application icon

Application badge

Brand identity

Vibration pattern

Android action buttons

Every notification must be immediately recognizable.

---

# 9. Scheduling Rules

Each active task owns exactly one active schedule.

Scheduling is deterministic.

Scheduling depends only on:

Task

Reminder Time

Subscription

Current Time

No randomness is permitted.

---

# 10. Scheduling Algorithm

When a task is created:

Validate Task

↓

Persist Database

↓

Compute Delay

↓

Persist Local Schedule

↓

Register Timer

↓

Trigger Notification

↓

Destroy Local Schedule

Every step MUST succeed or fail atomically from the engine's perspective.

---

# 11. Time Validation

Reminder time MUST satisfy:

Valid date

Future date

Parsable timestamp

Timezone consistency

If validation fails:

Scheduling MUST stop.

---

# 12. Notification Actions

FREE

Mark Done

Open Task

PRO

Mark Done

Open Task

Snooze 15 minutes

Quick Reschedule

Custom Reschedule

The engine exposes available actions.

The UI renders them.

---

# 13. Quick Reschedule

Quick actions include:

+15 minutes

+30 minutes

+1 hour

These actions SHALL NOT require opening the application.

The Notification Engine SHALL generate a new schedule immediately.

---

# 14. Custom Reschedule

Workflow

Notification

↓

User presses "Customize"

↓

Application opens

↓

Task Edit Screen

↓

User selects new date

↓

Database updated

↓

Old schedule removed

↓

New schedule created

At no point may two schedules coexist.

---

# 15. Snooze

Snooze creates a temporary reminder.

It does not duplicate the task.

Original reminder becomes inactive.

New reminder replaces it.

---

# 16. Notification Restoration

Restoration occurs:

Application restart

Browser restart

Device restart

Cache restoration

User login

The engine compares:

Database

vs

Local Queue

Missing schedules SHALL be recreated automatically.

---

# 17. Synchronization

The synchronization algorithm SHALL execute:

Download Pending Tasks

↓

Read Local Queue

↓

Compare Task IDs

↓

Create Missing Schedules

↓

Remove Invalid Schedules

↓

Validate Consistency

Synchronization must be idempotent.

---

# 18. Cancellation

Notifications are cancelled when:

Task completed

Task deleted

Reminder modified

Reminder expired

Account removed (future)

Cancellation removes:

Timer

Local Queue

Pending Storage

Notification Metadata

---

# 19. Consistency Rules

Exactly one notification per task.

No orphan notification.

No duplicated notification.

No expired notification.

No notification without task.

---

# 20. Storage Strategy

Authoritative Storage

PostgreSQL

Execution Storage

Browser localStorage

Runtime Memory

Timeout Registry

Service Worker

Runtime storage SHALL NEVER become authoritative.

---

# 21. Failure Recovery

Failure

↓

Restart

↓

Restore Queue

↓

Compare Database

↓

Recreate Missing Timers

↓

Resume Operation

No user intervention should be required.

---

# 22. Performance Targets

Scheduling

< 100 ms

Cancellation

< 50 ms

Restoration

< 2 seconds

Notification Display

Immediate after trigger

Synchronization

Linear complexity O(n)

---

# 23. Security Rules

The Notification Engine MUST NEVER:

Trust frontend permissions

Trust cached subscription

Expose internal identifiers

Persist sensitive information

Execute privileged actions without validation

---

# 24. Logging

The engine SHALL log:

Schedule Created

Schedule Cancelled

Schedule Restored

Notification Triggered

Notification Clicked

Notification Completed

Notification Rescheduled

Notification Failed

Logs SHALL contain:

Timestamp

Task ID

Notification ID

Operation

Result

No personal data shall be logged.

---

# 25. Observability

Future monitoring SHALL expose:

Pending Notifications

Triggered Notifications

Failed Notifications

Average Delay

Scheduling Latency

Restoration Success Rate

Duplicate Prevention Rate

---

# 26. Future Extensions

The engine SHALL support future additions without redesign.

Examples:

Recurring reminders

Smart reminders

AI-generated reminders

Location reminders

Calendar integration

Wear OS

Companion devices

Widgets

---

# 27. Non-Functional Requirements

Reliability

★★★★★

Determinism

★★★★★

Maintainability

★★★★★

Recoverability

★★★★★

Performance

★★★★★

Extensibility

★★★★★

---

# 28. Engineering Constraints

Gemini MUST NOT:

Duplicate scheduling logic.

Create parallel schedulers.

Move scheduling into React components.

Move scheduling into the backend.

Store timers in the database.

Replace the Service Worker.

Break synchronization.

---

# 29. Definition of Success

The Notification Engine is considered correct when:

Every task creates one notification.

Every notification is unique.

Every reminder appears on time.

Every restart restores pending reminders.

Every user interaction updates the task consistently.

No duplicate reminders exist.

No reminder is silently lost.

The Notification Engine remains deterministic under all supported scenarios.

---

END OF DOCUMENT
