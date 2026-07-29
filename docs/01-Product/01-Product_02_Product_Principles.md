# PRODUCT PRINCIPLES

Version: 1.0

Status: APPROVED

Owner: Product Architecture

Applies To:

- Product
- UX
- Engineering
- QA
- Gemini Code Assist

---

# 1. Purpose

This document defines the immutable product principles governing every feature, design decision, engineering choice, and AI-generated implementation inside TaskMyScreen.

Whenever a new feature is proposed, Gemini MUST first validate that it respects every principle defined below.

If one principle is violated, the implementation MUST stop until the conflict is resolved.

---

# 2. Product DNA

TaskMyScreen exists for one purpose:

Deliver the right reminder

to the right user

at the right moment

with the right context.

Everything else is secondary.

---

# 3. The Notification Principle

## Principle

The notification IS the application.

The task exists only because a notification will eventually be displayed.

Without notification,

there is no product.

---

Engineering implications

Gemini MUST always prioritize:

Notification reliability

Notification delivery

Notification timing

Notification rendering

Notification restoration

Notification actions

before considering UI improvements.

---

# 4. The Context Principle

Human memory is contextual.

Text alone is insufficient.

Each reminder should include visual context whenever possible.

Therefore:

Every notification SHOULD display the uploaded screenshot.

The screenshot is considered part of the reminder.

Not merely an attachment.

---

Engineering implications

Image loading

Image caching

Image persistence

Image synchronization

must be treated as critical components.

---

# 5. The Precision Principle

Notifications are valuable only if they arrive precisely.

A notification delivered:

too early

or

too late

is considered a product failure.

---

Engineering implications

Scheduling accuracy has higher priority than UI animations.

Scheduling accuracy has higher priority than rendering optimizations.

Scheduling accuracy has higher priority than feature development.

---

# 6. The Simplicity Principle

Users must create reminders in seconds.

The application should require minimal thinking.

Every additional tap must be justified.

---

Gemini MUST reduce:

screens

dialogs

confirmation windows

navigation depth

typing effort

whenever possible.

---

# 7. Native Experience Principle

Although TaskMyScreen is a Progressive Web Application,

users should perceive it as a native Android application.

---

Examples

Native notification behavior

Native sharing

Native animations

Native scrolling

Native startup

Native responsiveness

---

Gemini MUST prefer Web Platform APIs capable of reproducing native behavior.

---

# 8. Reliability Principle

Reliability is more important than features.

A smaller feature set

with perfect reliability

is preferable to

many unreliable features.

---

Engineering priority

Reliability

↓

Correctness

↓

Maintainability

↓

Performance

↓

New Features

---

# 9. Minimal Cognitive Load Principle

Users should never need to remember why they created a reminder.

The reminder itself should explain everything.

Every reminder should answer immediately:

What?

Why?

When?

Where?

---

The uploaded screenshot is essential to this objective.

---

# 10. Immediate Recognition Principle

Within one second,

the user should recognize the reminder.

The application should avoid requiring users to:

open the application

search for information

interpret ambiguous text

guess context

---

# 11. Zero Surprise Principle

TaskMyScreen should behave predictably.

Users should never wonder:

Will this reminder appear?

Will it disappear?

Will it trigger twice?

Will it be lost?

Predictability builds trust.

---

# 12. User Trust Principle

Trust is the application's most valuable asset.

Every feature should reinforce user confidence.

Trust is earned through:

accurate reminders

stable behavior

clear interfaces

predictable interactions

secure data handling

---

# 13. User Control Principle

The user controls reminders.

The application assists.

It does not decide.

Automatic behavior must always remain understandable.

---

Users must always know:

when a reminder is scheduled

when it will appear

what it will display

what actions are available

---

# 14. Premium Value Principle

Premium features must provide genuine productivity improvements.

Restrictions imposed on Free users exist only to encourage upgrading through added value.

Premium must never feel punitive.

---

Free users receive a complete experience.

Premium users receive an enhanced experience.

---

# 15. Free User Principles

Free users SHALL be able to:

Create reminders.

Receive reminders.

Open reminders.

Complete reminders.

Delete reminders.

Authenticate.

Synchronize reminders.

Restore reminders.

---

Free users SHALL NOT be able to:

Reschedule reminders after notification trigger.

Access unlimited monthly reminders.

Access future premium productivity features.

---

# 16. Pro User Principles

Pro users SHALL additionally receive:

Unlimited reminders.

Reminder rescheduling.

Quick snooze actions.

Custom reminder scheduling.

Future productivity enhancements.

---

Premium capabilities must always save time.

Never add complexity.

---

# 17. Android Notification Principle

The notification is the primary interface.

Not the task list.

Not the dashboard.

Not the home page.

The notification.

---

Engineering consequences

Notification UX has priority over:

Dashboard

Statistics

Animations

Themes

Secondary pages

---

# 18. Performance Principle

Performance directly affects trust.

The application should feel instantaneous.

Target objectives:

Cold start < 2 seconds

Task creation < 1 second

Reminder scheduling immediate

Notification opening immediate

Task editing immediate

---

# 19. Battery Principle

TaskMyScreen must consume minimal battery.

Background execution should remain lightweight.

The application should avoid:

continuous polling

unnecessary timers

background CPU usage

duplicate scheduling

redundant synchronization

---

# 20. Offline Principle

Users may temporarily lose connectivity.

The application should continue functioning whenever technically possible.

Scheduled reminders already stored locally must continue working.

Synchronization resumes automatically when connectivity returns.

---

# 21. Accessibility Principle

Every reminder should remain understandable.

Buttons must be readable.

Contrast must remain high.

Touch targets must be comfortable.

Screen readers should identify every action.

Accessibility is mandatory.

---

# 22. Evolution Principle

Every future feature must strengthen the notification experience.

Features unrelated to reminders should be rejected unless they create measurable value.

TaskMyScreen is intentionally specialized.

Feature accumulation must never dilute product identity.

---

# 23. Product Decision Hierarchy

Whenever several solutions exist,

Gemini SHALL evaluate them using this order:

1. Product Vision

↓

2. User Value

↓

3. Reliability

↓

4. Simplicity

↓

5. Maintainability

↓

6. Performance

↓

7. Development Cost

Only after satisfying higher priorities may lower priorities influence the decision.

---

# 24. Product Anti-Goals

TaskMyScreen SHALL NOT become:

A project management platform.

A collaborative workspace.

A messaging application.

A social network.

A calendar replacement.

A note-taking application.

A document manager.

Its identity remains focused:

Personal visual reminders.

---

# 25. Final Product Principle

Every engineering decision should answer one question:

"Will this improve the reminder experience?"

If the answer is no,

the change should be reconsidered.

---

END OF DOCUMENT
