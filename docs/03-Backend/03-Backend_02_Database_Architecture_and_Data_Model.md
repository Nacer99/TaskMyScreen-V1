# DATABASE ARCHITECTURE & DATA MODEL

Version: 1.0

Status: APPROVED

Criticality: CRITICAL

Owner: Software Architecture

Applies To

- Backend
- Database
- Notification Engine
- Gemini Code Assist
- QA

---

# 1. Purpose

The PostgreSQL database is the permanent and authoritative storage of TaskMyScreen.

Every business object persists here.

No browser storage, Service Worker cache or React state may become the source of truth.

---

# 2. Design Principles

The database SHALL satisfy the following principles:

Single Source of Truth

Consistency

Determinism

Referential Integrity

Normalization

Auditability

Future Scalability

Every schema evolution must preserve these principles.

---

# 3. Current Logical Model

Current business entities

```
User

 │

 └──────────────┐

                │

              Task
```

Future entities

```
User

 │

 ├────────────── Subscription

 │

 ├────────────── Statistics

 │

 ├────────────── Preferences

 │

 └────────────── Task

                     │

                     ├──────── Reminder

                     │

                     ├──────── History

                     │

                     ├──────── Attachment

                     │

                     └──────── Analytics
```

The architecture must already anticipate this evolution.

---

# 4. User Entity

Purpose

Represents one authenticated account.

Current fields

User ID

Email

Plan

Created Date

Future fields

Language

Timezone

Notification Preferences

Theme

Avatar

Deletion Date

Last Login

Notification Permissions

---

# 5. Task Entity

Purpose

Represents one reminder created by one user.

Current fields

Task ID

User ID

Title

Description

Image URL

Reminder Time

Completed

Created Date

Future fields

Updated Date

Completed Date

Priority

Folder

Tags

Reminder Status

Reminder History

Timezone

AI Metadata

Version Number

---

# 6. Relationships

One User

↓

owns many

↓

Tasks

One Task

↓

belongs to one

↓

User

No orphan task may exist.

---

# 7. Primary Keys

User

Primary Key

Clerk User ID

Task

Primary Key

UUID

Primary keys are immutable.

---

# 8. Foreign Keys

Task.UserID

↓

references

↓

User.ID

Deletion policies shall be explicitly defined.

---

# 9. Naming Convention

Tables

snake_case

Columns

snake_case

Indexes

idx_

Foreign Keys

fk_

Primary Keys

pk_

Unique Constraints

uq_

Check Constraints

ck_

---

# 10. Data Types

Identifiers

UUID

Dates

TIMESTAMP WITH TIME ZONE

Boolean

BOOLEAN

Title

TEXT

Description

TEXT

Image URL

TEXT

Subscription

TEXT (future ENUM)

Never use VARCHAR without a business reason.

---

# 11. Time Management

Every timestamp SHALL be stored in UTC.

Frontend converts to local timezone.

No local timezone storage.

No browser timezone persistence.

---

# 12. Reminder Time

Reminder Time represents the exact instant the notification should appear.

Rules

Mandatory

UTC

Immutable until update

Future value only

Changing Reminder Time invalidates the previous notification schedule.

---

# 13. Image Storage

The database stores only:

Image URL

Never binary content.

Image binaries remain in AWS S3 compatible storage.

The URL must remain immutable.

---

# 14. Subscription Plan

Current values

Free

Pro

Lifetime

Future implementation SHOULD migrate toward a dedicated Subscription table.

---

# 15. Constraints

Task Title

Required

Task Owner

Required

Reminder Time

Required

User

Required

Image URL

Optional

Description

Optional

Completed

Required

---

# 16. Business Constraints

A Task cannot exist without a User.

A Reminder cannot exist without a Task.

A Task cannot own multiple active reminders.

A deleted Task cannot be scheduled.

A completed Task cannot remain pending.

---

# 17. Indexing Strategy

Primary indexes

User ID

Task ID

Reminder Time

Composite indexes

(UserID, ReminderTime)

(UserID, Completed)

(UserID, CreatedDate)

Future indexes

Priority

Folder

Tags

Analytics

---

# 18. Query Optimization

Most frequent queries

User Tasks

Pending Tasks

Completed Tasks

Upcoming Tasks

Monthly Statistics

Indexes must optimize these queries first.

---

# 19. Data Integrity

Integrity is guaranteed through

Foreign Keys

Check Constraints

Transactions

Application Validation

No duplicate business validation.

---

# 20. Transaction Rules

The following operations require transactions

Task Creation

Task Update

Task Completion

Reminder Reschedule

Future Subscription Changes

Transactions must always complete or rollback.

---

# 21. Soft Delete Strategy

Current version

Physical deletion acceptable.

Future version

Soft Delete

DeletedAt

DeletedBy

Deletion Reason

This evolution shall not require redesign.

---

# 22. Migration Strategy

Every schema evolution shall use versioned migrations.

Never modify production tables manually.

Every migration must be reversible whenever technically possible.

---

# 23. Future Tables

Subscription

ReminderHistory

TaskAttachment

NotificationLog

AuditLog

Statistics

Preferences

AIRecommendations

These tables shall integrate without redesigning current entities.

---

# 24. Data Ownership

User Table

Owns identity.

Task Table

Owns reminder data.

Notification Engine

Owns runtime scheduling only.

Service Worker

Owns execution only.

No runtime component owns persistent business data.

---

# 25. Security

Sensitive information SHALL NEVER be stored:

Authentication tokens

Stripe secrets

AWS secrets

Session cookies

Browser cache

Notification payload history

Secrets remain outside PostgreSQL.

---

# 26. Performance Targets

Task lookup

<20 ms

Insert

<20 ms

Update

<20 ms

Delete

<20 ms

Statistics queries

<50 ms

---

# 27. Scalability

The schema SHALL support:

Millions of users

Tens of millions of tasks

Horizontal API scaling

Read replicas

Future sharding

No redesign should be necessary.

---

# 28. Backup Strategy

Daily backups

Point-in-time recovery

Automated restore validation

Encrypted backups

Geographically redundant storage

---

# 29. Engineering Constraints

Gemini MUST NOT

Store notification timers.

Store Service Worker state.

Store React UI state.

Persist browser cache.

Duplicate reminder information.

Persist notification execution state.

Persist temporary scheduling metadata.

---

# 30. Definition of Success

The database architecture is compliant when

Every entity has a single responsibility.

Relationships remain normalized.

Data integrity is guaranteed.

Future features integrate without redesign.

Runtime state never contaminates business data.

PostgreSQL remains the only authoritative persistent storage.

---

END OF DOCUMENT
