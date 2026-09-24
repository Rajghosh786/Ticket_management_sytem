# TicketManager — Frontend Specification

## 1. Frontend Goal

Build a fast, clean React + Tailwind SPA that demonstrates the complete TicketManager ticket lifecycle.

The frontend should prioritize:

* Clear role-based workflows
* Simple navigation
* Ticket visibility
* SLA/ageing visibility
* Easy demonstration by the evaluator
* Responsive UI
* Minimal unnecessary complexity

---

# 2. Application Structure

The application uses two main views:

```text
/login
/dashboard
```

The dashboard is a unified role-aware interface.

```text
                         LOGIN
                           │
                           ▼
                    Authenticate
                           │
                           ▼
                     JWT + User
                           │
                           ▼
                       DASHBOARD
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
    STUDENT          STAFF / DEPT ADMIN      ADMIN
       │                   │                   │
       ▼                   ▼                   ▼
 Student UI          Department UI        Global UI
```

---

# 3. Authentication Screen

## Login

Fields:

```text
Email
Password
[Login]
```

## Registration

Fields:

```text
Name
Email
Password
Confirm Password
[Create Student Account]
```

Public registration always creates:

```text
role = STUDENT
```

Users cannot select ADMIN, DEPARTMENT_ADMIN, or STAFF during public registration.

---

# 4. Reviewer Quick Access

The login page should provide clearly labeled demo buttons.

```text
Demo Accounts

[ Student ]
[ Finance Staff ]
[ Finance Department Admin ]
[ System Admin ]
```

The buttons should authenticate through the normal application authentication flow rather than bypassing the backend authorization model.

The purpose is to allow the evaluator to test the complete workflow quickly.

---

# 5. Student Dashboard

## Header

Display:

```text
TicketManager
Student Name
Student ID
Logout
```

Primary action:

```text
[ + Raise New Ticket ]
```

---

## Student KPI Cards

```text
My Active
Pending Action
Resolved
Closed
```

---

## My Tickets

Each ticket card/table row displays:

```text
Ticket ID
Subject
Category
Priority
Status
Age
SLA
Assigned Department
Updated At
```

Example:

```text
#CD-1024
Fee Refund Request

FEES
MEDIUM
IN_PROGRESS

Age: 14h
SLA: 34h remaining
```

---

# 6. Raise Ticket

Form:

```text
Category
Priority
Subject
Description

[Create Ticket]
```

Category options:

```text
Fees
Attendance
Certificates
IT Support
```

The backend determines:

```text
Department
SLA
Initial status
```

The frontend should not be the authority for these values.

---

# 7. Student Ticket Detail

Display:

```text
Ticket ID
Subject
Description
Category
Priority
Status
Department
Assigned Staff
Age
SLA
Created At
```

Then:

```text
Activity Timeline
```

---

## Pending Student Action

When:

```text
status = PENDING_STUDENT_ACTION
```

show:

```text
Additional Information Required

[Staff Query]

[Response Textarea]

[Submit Response]
```

Submitting the response changes the ticket back to:

```text
IN_PROGRESS
```

---

## Resolved Ticket

When:

```text
status = RESOLVED
```

show:

```text
Resolution
Resolved At

[Confirm & Close]
[Reopen]
```

Reopen requires:

```text
Reopen Reason
```

---

# 8. Staff Dashboard

Staff sees tickets relevant to their department and assignment.

## KPI Cards

```text
Assigned to Me
In Progress
Pending Student
At Risk
Breached
Resolved
```

---

## Ticket Queue

Columns:

```text
ID
Student
Category
Ageing
Priority
SLA
Status
Assigned To
Actions
```

Filters:

```text
Status
Priority
Category
SLA Status
Search
```

Staff should primarily work on tickets assigned to them.

---

# 9. Staff Ticket Detail

Display:

```text
Student
Category
Description
Priority
Status
SLA
Ageing
Assigned Staff
Activity Timeline
```

Actions:

```text
[Start Investigation]

[Request Student Information]

[Resolve Ticket]
```

When requesting information:

```text
Query / Message
[Send Request]
```

When resolving:

```text
Resolution Notes *
[Resolve Ticket]
```

Resolution notes are mandatory.

---

# 10. Department Admin Dashboard

Department Admin is scoped to their own department.

## KPI Cards

```text
Total Active
Unassigned
In Progress
Pending Student
At Risk
Breached
Resolved
```

---

## Department Queue

Columns:

```text
ID
Student
Category
Ageing
Priority
SLA
Status
Assigned To
Actions
```

Actions:

```text
Assign Staff
Change Priority
View Ticket
```

---

## Assignment

Assignment modal:

```text
Ticket
Current Department

Select Staff
[Assign]
```

Only staff belonging to the relevant department should be available.

---

# 11. Admin Dashboard

System Admin has global visibility.

## KPI Cards

```text
Total Tickets
Active
Unassigned
Pending Student
At Risk
Breached
Resolved
Closed
```

---

## Global Queue

Filters:

```text
Department
Category
Status
Priority
SLA Status
Assigned Staff
Search
```

Columns:

```text
ID
Student
Department
Category
Ageing
Priority
SLA
Status
Assigned To
Actions
```

---

# 12. SLA Display

Create a reusable:

```text
SlaTimer.jsx
```

It should calculate the remaining time from the server-provided SLA information.

Examples:

```text
14h 32m remaining
```

```text
2h 10m remaining
```

```text
BREACHED
```

Do not hard-code SLA countdown values in the frontend.

The backend remains the source of truth.

---

# 13. Ageing Display

Create a reusable ageing display.

Examples:

```text
Age: 4h 22m
Age: 27h 10m
Age: 3d 4h
```

For tickets in:

```text
PENDING_STUDENT_ACTION
```

clearly indicate that the SLA timer is paused.

Example:

```text
SLA PAUSED
Waiting for student
```

---

# 14. Status Badges

Create:

```text
StatusBadge.jsx
```

Supported statuses:

```text
OPEN
IN_PROGRESS
PENDING_STUDENT_ACTION
RESOLVED
CLOSED
REOPENED
```

Example visual treatment:

```text
OPEN                    neutral
IN_PROGRESS             blue
PENDING_STUDENT_ACTION  amber
RESOLVED                green
CLOSED                  muted
REOPENED                purple/attention
```

---

# 15. SLA Badges

SLA status:

```text
WITHIN_SLA
AT_RISK
BREACHED
```

Visual treatment:

```text
WITHIN_SLA  → normal
AT_RISK     → warning
BREACHED    → red/high attention
```

Breached tickets should be visually prominent in Admin and Department Admin queues.

---

# 16. Audit Timeline

Create:

```text
AuditTimeline.jsx
```

Example:

```text
09:42
Ticket created
by Rahul

10:15
Assigned to Sarah
by Finance Admin

11:20
Status changed to IN_PROGRESS
by Sarah

13:40
Additional information requested
by Sarah

17:10
Student responded
by Rahul

18:30
Ticket resolved
by Sarah
```

The timeline should be chronological and easy to scan.

---

# 17. Role-Based UI

The frontend should conditionally expose features based on the authenticated user's role.

```text
STUDENT
├── Create Ticket
├── Own Tickets
├── Respond
├── Confirm
└── Reopen

STAFF
├── Assigned Tickets
├── Department Tickets
├── Request Information
└── Resolve

DEPARTMENT_ADMIN
├── Department Tickets
├── Assign Staff
├── Change Priority
└── Department KPIs

ADMIN
├── All Tickets
├── All Departments
├── Assign Staff
├── Global KPIs
└── Global SLA Visibility
```

Important:

> Frontend role checks are for UX. Backend authorization remains the actual security boundary.

---

# 18. Suggested Component Structure

```text
src/
│
├── components/
│   ├── StatusBadge.jsx
│   ├── SlaTimer.jsx
│   ├── AgeingDisplay.jsx
│   ├── AuditTimeline.jsx
│   ├── TicketCard.jsx
│   ├── TicketTable.jsx
│   ├── TicketDetailModal.jsx
│   ├── MetricCard.jsx
│   └── ProtectedRoute.jsx
│
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Dashboard.jsx
│
├── context/
│   └── AuthContext.jsx
│
├── services/
│   ├── authService.js
│   └── ticketService.js
│
└── App.jsx
```

---

# 19. Core Frontend Flow

```text
LOGIN
  │
  ▼
AUTH CONTEXT
  │
  ├─────────────┬──────────────┬─────────────────┐
  ▼             ▼              ▼                 ▼
STUDENT       STAFF      DEPARTMENT_ADMIN      ADMIN
  │             │              │                 │
  ▼             ▼              ▼                 ▼
Dashboard    Dashboard      Dashboard         Dashboard
  │             │              │                 │
  ▼             ▼              ▼                 ▼
Tickets       Queue          Dept Queue        Global Queue
  │             │              │                 │
  ▼             ▼              ▼                 ▼
Create        Work           Assign            Manage
Respond       Resolve        Monitor           Monitor
Close         Resolve        Escalate           Escalate
Reopen
```

---

# 20. Frontend Implementation Rules

1. Do not duplicate business logic unnecessarily.
2. Do not hard-code SLA deadlines.
3. Do not trust frontend role checks for authorization.
4. Use server responses as the source of truth.
5. Keep components reusable.
6. Keep the interface responsive.
7. Handle loading, empty, and error states.
8. Disable actions during API requests to avoid duplicate submissions.
9. Show clear validation errors.
10. Keep the UI focused on the core ticket workflow.

---

# 21. Out of Scope

Do not implement unless time remains after the core workflow is complete:

```text
Real-time sockets
Email notifications
SMS notifications
File uploads
Advanced charts
Complex animations
External integrations
AI ticket classification
```

The complete ticket lifecycle is more important than additional features.