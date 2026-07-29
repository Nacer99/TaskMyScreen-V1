# DOMAIN MODEL

Version: 1.0

Status: APPROVED

Owner: Software Architecture

Applies To:

- Engineering
- Product
- QA
- Gemini Code Assist

---

# 1. Purpose

This document defines the business domain of TaskMyScreen.

It describes the domain independently from any programming language, framework or database.

Business rules MUST always originate from this document.

The database implementation is merely one possible technical representation of this domain.

---

# 2. Domain Overview

TaskMyScreen manages one business process only:

Remembering a future action.

The complete business flow is:

User

↓

Task

↓

Reminder

↓

Notification

↓

User Action

↓

Task Update

Every feature implemented in the application MUST belong somewhere in this lifecycle.

---

# 3. Ubiquitous Language

The following vocabulary SHALL be used consistently across the entire project.

## User

An authenticated person using TaskMyScreen.

A User owns Tasks.

A User owns a Subscription Plan.

---

## Task

A future action the user wants to remember.

A Task is NOT a notification.

A Task GENERATES a notification.

---

## Reminder Time

The exact date and time chosen by the user.

Reminder Time belongs to the Task.

---

## Notification

A scheduled visualization of a Task.

Notifications are generated.

They are never manually created.

---

## Screenshot

Visual context attached to a Task.

A Screenshot improves recognition.

A Screenshot is optional.

---

## Reminder

Business concept representing the scheduled occurrence of a Task.

The current implementation maps one Reminder to one Task.

Future versions MAY support recurring reminders.

---

## Free User

User subscribed to the Free plan.

---

## Pro User

User subscribed to the Pro plan.

---

## Lifetime User

User with permanent premium rights.

---

# 4. Aggregate Root

The aggregate root is:

Task

Everything revolves around Task.

Nothing modifies notifications directly.

Notifications always originate from Tasks.

---

# 5. Domain Entities

## User

Responsibilities

Own Tasks.

Authenticate.

Own Subscription.

Own Notification Permissions.

---

Attributes

User ID

Email

Plan

Creation Date

---

Lifecycle

Created

↓

Authenticated

↓

Uses Application

↓

Deletes Account (future)

---

## Task

Responsibilities

Represent a reminder.

Generate notifications.

Store reminder information.

---

Attributes

Task ID

User ID

Title

Description

Reminder Time

Screenshot URL

Status

Creation Date

Last Update Date (future)

---

Task does NOT contain:

Notification state

Timeout handles

Service Worker state

Browser cache

---

## Notification

Notification is NOT stored as a domain entity.

Notification is a projection.

It is generated from:

Task

+

Reminder Time

+

Plan

+

Screenshot

---

# 6. Value Objects

## ReminderTime

Represents a future timestamp.

Rules

Must exist.

Must be valid.

Must be understandable by JavaScript Date.

Should be in the future.

---

## ScreenshotReference

Represents one immutable URL.

Rules

Never stores binary data.

Always points to cloud storage.

Immutable after upload.

---

## SubscriptionPlan

Allowed values

Free

Pro

Lifetime

No other values are permitted.

---

# 7. Relationships

One User

↓

owns many

↓

Tasks

One Task

↓

generates one

↓

Notification

One Notification

↓

belongs to one

↓

Task

---

# 8. Domain Events

The system reacts to business events.

These events are conceptual.

Implementation details may vary.

---

TaskCreated

Meaning

A new reminder exists.

Consequences

Persist database.

Schedule notification.

Refresh UI.

---

TaskUpdated

Consequences

Update database.

Recalculate notification.

---

TaskCompleted

Consequences

Cancel notification.

Persist completion.

Refresh UI.

---

TaskDeleted

Consequences

Delete database record.

Cancel notification.

Delete local scheduling.

---

ReminderRescheduled

Consequences

Replace previous schedule.

Persist database.

Generate new notification.

---

NotificationTriggered

Consequences

Display reminder.

Await user interaction.

---

NotificationDismissed

Consequences

Record analytics (future).

No business state changes.

---

NotificationOpened

Consequences

Navigate to task.

---

NotificationCompleted

Consequences

Complete task.

Cancel reminder.

---

NotificationSnoozed

Pro only.

Consequences

Generate temporary reminder.

Original reminder considered postponed.

---

NotificationCustomized

Pro only.

Consequences

Open edit screen.

User selects new reminder time.

Replace previous reminder.

---

# 9. Task Lifecycle

Draft

↓

Created

↓

Scheduled

↓

Waiting

↓

Notification Triggered

↓

Completed

or

Rescheduled

or

Deleted

No other lifecycle is valid.

---

# 10. Notification Lifecycle

Generated

↓

Scheduled

↓

Pending

↓

Displayed

↓

User Interaction

↓

Closed

↓

Destroyed

Notifications are ephemeral.

Tasks are persistent.

---

# 11. Business Invariants

Invariant 1

A Task always belongs to one User.

---

Invariant 2

A Task always owns one Reminder Time.

---

Invariant 3

A Task generates at most one active Notification.

---

Invariant 4

Two active notifications SHALL NEVER exist for the same Task.

---

Invariant 5

Completing a Task removes every pending notification.

---

Invariant 6

Deleting a Task removes every pending notification.

---

Invariant 7

Changing Reminder Time invalidates previous scheduling.

---

Invariant 8

Task IDs never change.

---

Invariant 9

User IDs never change.

---

Invariant 10

Screenshot URLs never identify users.

---

# 12. Business Capabilities

## Free

Create Task

Edit Task

Delete Task

Receive Notification

Open Notification

Complete Task

Upload Screenshot

Synchronize

Restore Notifications

Monthly quota applies.

---

## Pro

Everything included in Free.

Additionally:

Unlimited reminders.

Quick Snooze.

Quick Reschedule.

Custom Reschedule.

Future productivity features.

---

# 13. Forbidden Business States

The following situations are invalid.

Completed Task

+

Scheduled Notification

❌

Deleted Task

+

Notification Exists

❌

Notification

+

No Task

❌

Reminder Time Missing

❌

Unknown Subscription

❌

Duplicate Task IDs

❌

Duplicate Notification Scheduling

❌

---

# 14. Business Ownership Matrix

User

Owns identity.

---

Task

Owns reminder data.

---

Notification Engine

Owns scheduling.

Never owns business state.

---

Service Worker

Owns delivery.

Never owns reminder data.

---

Backend

Owns business truth.

---

Database

Owns persistence.

---

Frontend

Owns presentation only.

---

# 15. Domain Evolution Rules

Future features MUST extend the existing model.

They MUST NOT replace it.

Examples of acceptable extensions:

Recurring reminders.

Location-based reminders.

Wear OS reminders.

Voice reminders.

Smart reminders.

Multiple screenshots.

History.

Analytics.

Examples of unacceptable evolution:

Replacing Task with Notification.

Moving business logic into Service Worker.

Moving business logic into React Components.

Using localStorage as authoritative storage.

---

# 16. Domain Success Criteria

The domain model is considered correct when:

Business terminology is consistent.

Tasks remain the aggregate root.

Notifications remain derived objects.

All invariants are preserved.

No business logic is duplicated.

Every future feature can integrate without redesigning the domain.

---

END OF DOCUMENT
