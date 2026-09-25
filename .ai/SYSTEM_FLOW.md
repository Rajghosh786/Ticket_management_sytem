# TicketManager — System Flow & Business Rules

## 1. Product Goal

TicketManager manages administrative support requests raised by students.

The system allows the institution to:

* Receive student requests
* Automatically route requests to departments
* Assign requests to staff
* Track ticket status and ownership
* Monitor SLA and ageing
* Handle pending student actions
* Escalate overdue tickets
* Record resolutions
* Maintain an immutable activity history
* Provide management visibility

---

# 2. High-Level Architecture

```text
┌──────────────────────────────┐
│       React SPA / Vite      │
│                              │
│ Student / Staff / Admin UI   │
└──────────────┬───────────────┘
               │
               │ JSON / REST
               │ JWT Bearer Token
               ▼
┌──────────────────────────────┐
│       Express.js API         │
│                              │
│ Auth                         │
│ Ticket Management            │
│ SLA / Ageing                 │
│ Assignment                   │
│ Audit History                │
└──────────────┬───────────────┘
               │
               │ Mongoose
               ▼
┌──────────────────────────────┐
│        MongoDB Atlas         │
│                              │
│ Users                        │
│ Tickets                      │
│ Audit Logs                   │
│ Departments                  │
└──────────────────────────────┘
```

---

# 3. User Roles

```text
                         ┌─────────────┐
                         │    ADMIN    │
                         └──────┬──────┘
                                │
                  Global visibility / management
                                │
             ┌──────────────────┴──────────────────┐
             │                                     │
             ▼                                     ▼
 ┌───────────────────────┐              ┌──────────────────┐
 │ DEPARTMENT_ADMIN      │              │     STAFF        │
 │                       │              │                  │
 │ Department ownership  │              │ Ticket handling  │
 │ Staff assignment      │              │ Resolution       │
 │ Department KPIs       │              │ Student queries  │
 └───────────┬───────────┘              └────────┬─────────┘
             │                                   │
             └────────────────┬──────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │    STUDENT     │
                     │                │
                     │ Raise requests │
                     │ Respond        │
                     │ Confirm/reopen │
                     └────────────────┘
```

---

# 4. Registration & Authentication

## Public Registration

Public registration creates only a `STUDENT` account.

```text
STUDENT
       │
       ▼
REGISTER
   │
       ├── Email
       ├── Password
       ├── Confirm Password
       └── Roll No
   │
   ▼
Backend Validation
       │
       ▼
role = STUDENT
       │
       ▼
Account Created
       │
       ▼
Login
       │
       ▼
Student Dashboard
```

Staff, Department Admin, and Admin accounts are provisioned as administrative/demo accounts.

## Login

```text
LOGIN
   │
   ▼
Validate Credentials
   │
   ▼
Generate JWT
   │
   ▼
Identify User Role
   │
   ├──────────────┬────────────────┬─────────────────┐
   ▼              ▼                ▼                 ▼
STUDENT         STAFF       DEPARTMENT_ADMIN      ADMIN
   │              │                │                 │
   ▼              ▼                ▼                 ▼
Student UI     Staff UI       Dept Admin UI      Admin UI
```

---

# 5. Ticket Categories

```text
┌─────────────────┬─────────────────┬──────────┐
│ Category        │ Department      │ SLA      │
├─────────────────┼─────────────────┼──────────┤
│ IT_SUPPORT      │ IT              │ 12 hours │
│ ATTENDANCE      │ Academic        │ 24 hours │
│ FEES            │ Finance         │ 48 hours │
│ CERTIFICATES    │ Administration  │ 72 hours │
└─────────────────┴─────────────────┴──────────┘
```

---

# 6. Complete Ticket Lifecycle

```text
                         ┌─────────────────────┐
                         │       STUDENT       │
                         │    Raise Ticket     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │        OPEN         │
                         └──────────┬──────────┘
                                    │
                                    │ Auto Category Routing
                                    ▼
                         ┌─────────────────────┐
                         │  DEPARTMENT QUEUE   │
                         └──────────┬──────────┘
                                    │
                                    │ Assign Staff
                                    ▼
                         ┌─────────────────────┐
                         │     IN_PROGRESS     │
                         └──────────┬──────────┘
                                    │
                       ┌────────────┴────────────┐
                       │                         │
                       │ More information        │ Resolution ready
                       │ required                │
                       ▼                         ▼
             ┌──────────────────────┐   ┌──────────────────────┐
             │ PENDING_STUDENT_     │   │      RESOLVED        │
             │ ACTION               │   │                      │
             └──────────┬───────────┘   └──────────┬───────────┘
                        │                          │
                        │ Student responds         │ Student reviews
                        ▼                          ▼
                ┌─────────────────┐       ┌────────┴────────┐
                │   IN_PROGRESS   │       │                 │
                └────────┬────────┘       ▼                 ▼
                         │             CLOSED           REOPENED
                         │                                │
                         └────────────────────────────────┘
                                          │
                                          ▼
                                    IN_PROGRESS
```

---

# 7. Ticket Creation

Student performs:

```text
Raise Ticket
    │
    ├── Category
    ├── Subject
    ├── Description
    │
    ▼
System determines Department
    │
    ▼
System calculates SLA
    │
    ▼
status = OPEN
    │
    ▼
Create AuditLog
    │
    └── TICKET_CREATED
```

Example:

```text
Category: FEES
Department: Finance
SLA: 48 hours
Status: OPEN
Priority: MEDIUM
```

---

# 8. Department Routing

The ticket category determines the initial department queue.

```text
FEES
  ↓
FINANCE

ATTENDANCE
  ↓
ACADEMIC

CERTIFICATES
  ↓
ADMINISTRATION

IT_SUPPORT
  ↓
IT
```

The student does not choose a staff member.

---

# 9. Assignment Flow

```text
                    OPEN TICKET
                         │
                         ▼
                 Department Queue
                         │
                         ▼
             Department Admin / Admin
                         │
                         │ Assign Staff
                         ▼
                  Assigned Staff
                         │
                         ▼
                    IN_PROGRESS
```

Every assignment creates an audit record:

```text
ASSIGNED_TO_STAFF
```

---

# 10. Staff Investigation

Staff can:

```text
IN_PROGRESS
     │
     ├───────────────┐
     │               │
     ▼               ▼
Need information   Can resolve
     │               │
     ▼               ▼
PENDING_           RESOLVED
STUDENT_ACTION
```

---

# 11. Pending Student Action

When staff needs more information:

```text
Staff
  │
  ▼
Request clarification
  │
  ├── Query / message
  └── Status = PENDING_STUDENT_ACTION
  │
  ▼
SLA CLOCK PAUSES
  │
  ▼
Student receives request
  │
  ▼
Student submits response
  │
  ▼
Status = IN_PROGRESS
  │
  ▼
SLA CLOCK RESUMES
```

### SLA Rule

Time spent in `PENDING_STUDENT_ACTION` does not count toward active SLA ageing.

The system records:

```text
slaPausedAt
totalPausedDuration
```

The effective SLA deadline accounts for the accumulated paused duration.

---

# 12. Resolution Flow

Staff can resolve a ticket only after providing resolution notes.

```text
IN_PROGRESS
     │
     ▼
Enter Resolution Notes
     │
     ▼
RESOLVED
     │
     ├── resolvedAt = current time
     └── AuditLog created
```

Resolution notes are mandatory when moving to `RESOLVED`.

---

# 13. Student Confirmation

```text
                 RESOLVED
                     │
                     ▼
              Student reviews
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
        Confirm & Close    Reopen
              │             │
              ▼             ▼
           CLOSED       REOPENED
                            │
                            │ within 48h
                            ▼
                        IN_PROGRESS
```

### Reopen Rules

* Only the student who owns the ticket can reopen it.
* Reopening is allowed within 48 hours of resolution.
* A reopen reason is required.
* A reopened ticket returns to `IN_PROGRESS`.
* The ticket requires another resolution before it can be closed again.

---

# 14. SLA Engine

Each ticket receives an SLA based on its category.

```text
Ticket Created
      │
      ▼
Category SLA
      │
      ▼
Calculate Deadline
      │
      ▼
Track Active SLA Time
      │
      ├───────────────────────┐
      │                       │
      ▼                       ▼
Within SLA                Deadline exceeded
      │                       │
      ▼                       ▼
NORMAL / AT_RISK           BREACHED
                              │
                              ▼
                       Management Escalation
```

---

# 15. SLA Status

The system separates business priority from operational SLA state.

## Business Priority

```text
LOW
MEDIUM
HIGH
CRITICAL
```

## SLA Status

```text
WITHIN_SLA
AT_RISK
BREACHED
```

A ticket becoming overdue updates its operational state and escalates its business priority:

```text
SLA BREACH
    │
    ├── isBreached = true
       ├── priority = CRITICAL
    ├── escalation visibility
    ├── highlighted in admin queue
    └── prioritized for management attention
```

## Management SLA Status Filters

Department Admin:

```text
Department Queue
       │
       ▼
SLA Status
       ├── All
       ├── Within SLA (isBreached = false)
       └── Breached (isBreached = true)
```

Admin:

```text
Global Ticket Queue
       │
       ▼
SLA Status
       ├── All
       ├── Within SLA (isBreached = false)
       └── Breached (isBreached = true)
```

Students do not select ticket priority when creating a ticket. New tickets start at `MEDIUM`; staff or Department Admin may reprioritize them, and a breach escalates the ticket to `CRITICAL`.

---

# 16. Ageing

Ticket ageing represents how long the ticket has been actively progressing through the support workflow.

```text
Active Ageing =
Current Time
- Created Time
- Time Spent Waiting For Student
```

Example:

```text
Created:              09:00
Pending Student:      13:00
Student Responded:    17:00

4 hours waiting for student
→ excluded from active SLA ageing
```

The UI should display:

```text
Age: 8h 42m
SLA: 15h 18m remaining
```

or:

```text
Age: 51h
SLA: BREACHED
```

---

# 17. SLA At-Risk State

The prototype can identify tickets approaching their SLA deadline.

```text
WITHIN_SLA
     │
     │ SLA approaching
     ▼
AT_RISK
     │
     │ Deadline exceeded
     ▼
BREACHED
```

At-risk and breached tickets should be visually distinguishable in the management dashboard.

---

# 18. Audit History

Important ticket events create immutable audit records.

Example:

```text
TICKET_CREATED
       ↓
ASSIGNED_TO_STAFF
       ↓
STATUS_CHANGED
       ↓
PENDING_STUDENT_ACTION
       ↓
STUDENT_RESPONDED
       ↓
STATUS_CHANGED
       ↓
RESOLVED
       ↓
CLOSED
```

An audit record contains:

```text
ticketId
action
performedBy
fromStatus
toStatus
metadata
createdAt
```

Examples:

```text
TICKET_CREATED
ASSIGNED_TO_STAFF
STATUS_CHANGED
STUDENT_RESPONDED
RESOLUTION_ADDED
TICKET_RESOLVED
TICKET_CLOSED
TICKET_REOPENED
```

Audit records are append-only and are not edited as part of normal ticket operations.

---

# 19. Role-Based Visibility

```text
┌────────────────────┬─────────┬───────┬──────────────┬───────┐
│ Capability          │ Student │ Staff │ Dept Admin   │ Admin │
├────────────────────┼─────────┼───────┼──────────────┼───────┤
│ Create Ticket       │   ✓     │       │              │       │
│ Own Tickets         │   ✓     │       │              │       │
│ Dept Tickets        │         │   ✓   │      ✓       │   ✓   │
│ Assign Staff        │         │       │      ✓       │   ✓   │
│ Change Status       │ Limited │   ✓   │      ✓       │   ✓   │
│ Request Information │         │   ✓   │      ✓       │   ✓   │
│ Resolve Ticket      │         │   ✓   │      ✓       │   ✓   │
│ Confirm & Close     │   ✓     │       │              │       │
│ Reopen Ticket       │   ✓     │       │              │       │
│ Dept KPIs           │         │       │      ✓       │   ✓   │
│ Global KPIs         │         │       │              │   ✓   │
│ Global Tickets      │         │       │              │   ✓   │
│ Audit History       │ Own     │ Dept  │      Dept    │ Global│
└────────────────────┴─────────┴───────┴──────────────┴───────┘
```

---

# 20. Management Dashboard

Department Admin:

```text
Department KPIs
│
├── Total Active
├── Unassigned
├── In Progress
├── Pending Student
├── At Risk
├── Breached
└── Resolved
```

System Admin:

```text
Global KPIs
│
├── Total Tickets
├── Active Tickets
├── Unassigned
├── Pending Student
├── At Risk
├── SLA Breached
├── Resolved
└── Tickets by Department
```

---

# 21. Main Data Entities

```text
┌──────────────┐
│    User      │
├──────────────┤
│ name         │
│ email        │
│ password     │
│ role         │
│ department   │
└──────┬───────┘
       │
       │ creates / owns / handles
       ▼
┌──────────────┐
│    Ticket    │
├──────────────┤
│ student      │
│ category     │
│ department   │
│ assignedTo   │
│ subject      │
│ description  │
│ priority     │
│ status       │
│ slaDeadline  │
│ slaPausedAt  │
│ pausedTime   │
│ isBreached   │
│ resolution   │
│ resolvedAt   │
│ createdAt    │
└──────┬───────┘
       │
       │ has many
       ▼
┌──────────────┐
│   AuditLog   │
├──────────────┤
│ ticketId     │
│ action       │
│ performedBy  │
│ fromStatus   │
│ toStatus     │
│ metadata     │
│ createdAt    │
└──────────────┘
```

---

# 22. Important Business Rules

### Ticket Creation

```text
Only authenticated users can create tickets.
Only STUDENT users can create student support tickets.
Category determines department.
Category determines SLA.
New tickets start as OPEN.
```

### Assignment

```text
Only DEPARTMENT_ADMIN and ADMIN can assign tickets.
Staff must belong to the ticket's department.
Assignment creates an audit record.
```

### Status Changes

```text
OPEN → IN_PROGRESS
IN_PROGRESS → PENDING_STUDENT_ACTION
IN_PROGRESS → RESOLVED
PENDING_STUDENT_ACTION → IN_PROGRESS
RESOLVED → CLOSED
RESOLVED → REOPENED
REOPENED → IN_PROGRESS
```

Invalid transitions should be rejected by the backend.

### Resolution

```text
RESOLVED requires resolutionNotes.
resolvedAt is recorded automatically.
```

### Reopening

```text
Only ticket owner can reopen.
Only within 48 hours of resolution.
Reopen reason required.
```

### SLA

```text
SLA starts at ticket creation.
SLA pauses during PENDING_STUDENT_ACTION.
SLA resumes after student response.
Resolved and closed tickets stop SLA processing.
Breached tickets are escalated to management visibility.
```

### Audit

```text
Important ticket actions are append-only.
Audit history cannot be edited through normal application operations.
```

---

# 23. Failure & Edge Cases

The system should handle:

```text
1. Student attempts to access another student's ticket.
2. Staff attempts to access a ticket outside their department.
3. Staff attempts to assign themselves when assignment is restricted.
4. Department Admin attempts to assign staff from another department.
5. Ticket is resolved without resolution notes.
6. Student attempts to reopen after 48 hours.
7. Student attempts to reopen a CLOSED ticket.
8. Student submits a response when no action is pending.
9. Invalid status transition.
10. SLA expires while ticket is pending student action.
11. Ticket is already breached when opened by an admin.
12. Assigned staff member becomes unavailable.
13. Duplicate status update requests.
14. Unauthorized user attempts to access admin APIs.
```

Backend authorization and validation should be treated as the final source of truth.

---

# 24. Prototype Scope

The prototype intentionally focuses on the core support lifecycle.

### Included

```text
Authentication
Role-based access
Ticket creation
Department routing
Assignment
Status workflow
Priority
SLA
SLA pause/resume
Ageing
Escalation visibility
Resolution
Student confirmation
Reopen
Audit history
Management dashboard
```

### Not included in the prototype

```text
Real-time chat
Email notifications
SMS notifications
File storage
Complex approval chains
External ERP integration
Advanced analytics
AI ticket classification
```

These can be added in a production version but are outside the scope of the assessment prototype.
