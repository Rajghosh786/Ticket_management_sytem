# TicketManager — Backend Specification

## 1. Backend Goal

The TicketManager backend provides:

* Authentication
* Role-based authorization
* Ticket creation
* Department routing
* Staff assignment
* Ticket lifecycle management
* SLA tracking
* SLA pause/resume
* Ageing calculation
* SLA breach detection
* Resolution tracking
* Reopen workflow
* Immutable audit history
* Management KPIs

The backend is the source of truth for business rules and authorization.

---

# 2. Technology

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcrypt
```

---

# 3. Domain Constants

## SLA Policy

```javascript
const SLA_POLICY = {
  FEES: {
    hours: 48,
    department: 'Accounts'
  },

  ATTENDANCE: {
    hours: 24,
    department: 'Academic Office'
  },

  CERTIFICATES: {
    hours: 72,
    department: 'Registrar'
  },

  IT_SUPPORT: {
    hours: 12,
    department: 'IT Helpdesk'
  }
};
```

---

# 4. Roles

```javascript
const ROLES = {
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  DEPARTMENT_ADMIN: 'DEPARTMENT_ADMIN',
  ADMIN: 'ADMIN'
};
```

## Role Responsibilities

### STUDENT

* Create tickets
* View own tickets
* Respond to pending requests
* Confirm resolved tickets
* Reopen resolved tickets within 48 hours

### STAFF

* View department tickets
* Work on assigned tickets
* Request student information
* Change ticket status
* Resolve tickets

### DEPARTMENT_ADMIN

* View department tickets
* Assign department staff
* Change priority
* Monitor department SLA
* Monitor ageing
* View department KPIs

### ADMIN

* View all tickets
* Assign staff
* Change priority
* Monitor all departments
* View global KPIs
* Monitor SLA breaches

---

# 5. User Collection

```javascript
{
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: [
      'STUDENT',
      'STAFF',
      'DEPARTMENT_ADMIN',
      'ADMIN'
    ],
    default: 'STUDENT'
  },
  department: {
    type: String,
    default: 'General'
  },
  rollNo: String,

  createdAt: Date,
  updatedAt: Date
}
```

### Rules

* Email is unique.
* Password is stored hashed.
* Public registration always creates `STUDENT`.
* Administrative roles are provisioned separately.
* Students may have a `rollNo`.
* Staff should belong to a department.
* Department Admins should belong to a department.
* System Admin has global access.

---

# 6. Ticket Collection

```javascript
{
  ticketId: String,

  studentId: {
    type: ObjectId,
    ref: 'User'
  },

  category: {
    type: String,
    enum: [
      'FEES',
      'ATTENDANCE',
      'CERTIFICATES',
      'IT_SUPPORT'
    ]
  },

  title: String,

  description: String,

  priority: {
    type: String,
    enum: [
      'LOW',
      'MEDIUM',
      'HIGH',
      'CRITICAL'
    ],
    default: 'MEDIUM'
  },

  status: {
    type: String,
    enum: [
      'OPEN',
      'IN_PROGRESS',
      'PENDING_STUDENT_ACTION',
      'RESOLVED',
      'CLOSED',
      'REOPENED'
    ],
    default: 'OPEN'
  },

  department: String,

  assignedTo: {
    type: ObjectId,
    ref: 'User',
    default: null
  },

  slaHours: Number,

  slaDeadline: Date,

  slaPausedAt: Date,

  totalPausedDuration: {
    type: Number,
    default: 0
  },

  isBreached: {
    type: Boolean,
    default: false
  },

  slaStatus: {
    type: String,
    enum: [
      'WITHIN_SLA',
      'AT_RISK',
      'BREACHED'
    ],
    default: 'WITHIN_SLA'
  },

  resolutionNotes: {
    type: String,
    default: ''
  },

  resolvedAt: Date,

  closedAt: Date,

  reopenedAt: Date,

  reopenReason: String,

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

---

# 7. Ticket ID

Tickets use a human-readable ID:

```text
TICK-1001
TICK-1002
TICK-1003
```

The MongoDB `_id` remains the internal database identifier.

`ticketId` is used by the UI and reviewer-facing screens.

---

# 8. AuditLog Collection

```javascript
{
  ticketId: {
    type: ObjectId,
    ref: 'Ticket',
    required: true
  },

  action: {
    type: String,
    required: true
  },

  performedBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },

  fromStatus: String,

  toStatus: String,

  details: String,

  timestamp: {
    type: Date,
    default: Date.now
  }
}
```

## Example Actions

```text
TICKET_CREATED
ASSIGNED_TO_STAFF
STATUS_CHANGED
STUDENT_RESPONDED
RESOLUTION_ADDED
TICKET_RESOLVED
TICKET_CLOSED
TICKET_REOPENED
PRIORITY_CHANGED
SLA_BREACHED
```

Audit records are append-only.

Normal application operations must never update or delete existing audit records.

---

# 9. Authentication Routes

Base URL:

```text
/api/auth
```

## POST /register

Creates a Student account.

### Request

```json
{
  "email": "rahul@example.com",
  "password": "password123",
  "rollNo": "STU001"
}
```

### Rules

```text
role = STUDENT
```

The client cannot submit:

```text
ADMIN
DEPARTMENT_ADMIN
STAFF
```

as the registration role.

Validation requires a valid email, a password, and a roll number. The password is hashed with bcrypt before storage. Duplicate emails return a conflict error. The server derives the required display name from the email local part because public registration does not collect a name. The response contains the safe created user; registration does not create a login session or JWT.

---

## POST /login

Authenticates the user.

Returns:

```json
{
  "token": "...",
  "user": {
    "id": "...",
    "name": "Rahul Sharma",
    "role": "STUDENT",
    "department": "General"
  }
}
```

---

# 10. Demo Account Seeding

For the assessment prototype, demo accounts and sample tickets may be seeded using a development-only seed script or protected development endpoint.

Demo users:

```text
STUDENT
student@ticketmanager.com

STAFF
finance.staff@ticketmanager.com

DEPARTMENT_ADMIN
finance.admin@ticketmanager.com

ADMIN
admin@ticketmanager.com
```

The seed operation must not be publicly accessible in production.

---

# 11. Ticket Routes

Base URL:

```text
/api/tickets
```

All ticket routes require JWT authentication.

---

# 12. POST /api/tickets

Creates a ticket.

### Request

```json
{
  "category": "FEES",
  "title": "Fee Refund Request",
  "description": "I have been charged twice."
}
```

### Server Logic

```text
1. Validate authenticated user.
2. Verify user is STUDENT.
3. Validate category.
4. Read SLA_POLICY.
5. Determine department.
6. Calculate SLA deadline.
7. Generate ticketId.
8. Set status = OPEN.
9. Set priority = MEDIUM.
10. Save ticket.
11. Create TICKET_CREATED audit record.
```

Example:

```text
Category:
FEES

Department:
Accounts

SLA:
48 hours

Status:
OPEN
```

---

# 13. GET /api/tickets

Returns tickets based on the authenticated user's role.

## STUDENT

Only tickets where:

```javascript
studentId === req.user.id
```

## STAFF

Tickets belonging to:

```javascript
department === req.user.department
```

Staff should primarily work on tickets assigned to them.

## DEPARTMENT_ADMIN

Tickets where:

```javascript
department === req.user.department
```

## ADMIN

All tickets.

---

# 14. Ticket Filters

Supported query parameters:

```text
?status=IN_PROGRESS
?category=FEES
?priority=HIGH
?slaStatus=BREACHED
?breached=false
?breached=true
?assignedTo=<userId>
?search=refund
```

Multiple filters may be combined.

For SLA filtering, `breached=false` returns tickets whose server-owned `isBreached` state is false, and `breached=true` returns tickets whose `isBreached` state is true. The existing role query is applied before these filters, so Student, Staff, Department Admin, and Admin authorization scopes remain enforced.

---

# 15. GET /api/tickets/:id

Returns:

* Ticket details
* Student
* Assigned staff
* Department
* SLA information
* Resolution information
* Audit history

Authorization must be checked before returning the ticket.

A student cannot access another student's ticket.

A staff member cannot access tickets outside their department.

A Department Admin cannot access tickets outside their department.

Admin can access all tickets.

---

# 16. PATCH /api/tickets/:id/assign

Assigns a ticket to Staff.

### Allowed Roles

```text
DEPARTMENT_ADMIN
ADMIN
```

### Request

```json
{
  "assignedTo": "staffUserId"
}
```

### Validation

The selected user must:

```text
role === STAFF
```

and:

```text
staff.department === ticket.department
```

### On Success

```text
ticket.assignedTo = staffUserId
```

Create:

```text
ASSIGNED_TO_STAFF
```

audit entry.

---

# 17. PATCH /api/tickets/:id/status

Changes ticket status.

### Allowed Transitions

```text
OPEN
  ↓
IN_PROGRESS

IN_PROGRESS
  ↓
PENDING_STUDENT_ACTION
  ↓
IN_PROGRESS

IN_PROGRESS
  ↓
RESOLVED

RESOLVED
  ↓
CLOSED

RESOLVED
  ↓
REOPENED
  ↓
IN_PROGRESS
```

Invalid transitions must return an error.

---

# 18. Pending Student Action

When:

```text
IN_PROGRESS → PENDING_STUDENT_ACTION
```

the server:

```text
1. Sets slaPausedAt = current time.
2. Changes status.
3. Records audit event.
4. Requires a staff query/message.
```

The SLA clock is paused.

---

# 19. Student Response

When the student responds:

```text
PENDING_STUDENT_ACTION
        ↓
IN_PROGRESS
```

The server:

```text
1. Calculates paused duration.
2. Adds duration to totalPausedDuration.
3. Clears slaPausedAt.
4. Extends effective SLA deadline.
5. Creates STUDENT_RESPONDED audit entry.
```

---

# 20. Resolution

When:

```text
IN_PROGRESS → RESOLVED
```

the server requires:

```text
resolutionNotes
```

Then:

```text
resolvedAt = current time
```

Create:

```text
TICKET_RESOLVED
```

audit record.

Resolved tickets stop active SLA processing.

---

# 21. Student Confirmation

Only the ticket owner can confirm resolution.

```text
RESOLVED → CLOSED
```

The server sets:

```text
closedAt = current time
```

Create:

```text
TICKET_CLOSED
```

audit record.

---

# 22. Reopen

Only the ticket owner can reopen a resolved ticket.

Conditions:

```text
status === RESOLVED
```

and:

```text
currentTime - resolvedAt <= 48 hours
```

A reopen reason is required.

Transition:

```text
RESOLVED
    ↓
REOPENED
    ↓
IN_PROGRESS
```

Create:

```text
TICKET_REOPENED
```

audit record.

A CLOSED ticket cannot be reopened through this workflow.

---

# 23. SLA Engine

Initial deadline:

```javascript
slaDeadline =
  createdAt + (slaHours * 60 * 60 * 1000)
```

When the ticket is pending student action:

```text
slaPausedAt = current time
```

When the student responds:

```text
pausedDuration =
  currentTime - slaPausedAt
```

Then:

```text
totalPausedDuration += pausedDuration
```

The effective deadline is extended by the total paused duration.

---

# 24. SLA Status

The backend calculates:

```text
WITHIN_SLA
AT_RISK
BREACHED
```

Suggested prototype rule:

```text
WITHIN_SLA
→ More than 25% SLA time remaining

AT_RISK
→ 25% or less SLA time remaining

BREACHED
→ SLA deadline exceeded
```

Tickets in:

```text
PENDING_STUDENT_ACTION
```

do not continue consuming SLA time.

---

# 25. SLA Breach

A ticket becomes breached when its effective SLA deadline has passed while the ticket is still active.

Active statuses:

```text
OPEN
IN_PROGRESS
REOPENED
```

A breached ticket:

```text
isBreached = true
slaStatus = BREACHED
```

The system creates:

```text
SLA_BREACHED
```

audit entry.

### Important

SLA breach does **not** automatically change:

```text
priority
```

Priority and SLA status are separate concepts.

A breached `LOW` priority ticket remains `LOW` priority.

The breach instead triggers management visibility and escalation.

---

# 26. Breach Detection

Breach detection can be performed through:

* A scheduled background process
* A dedicated SLA service
* A periodic server-side check

The API may also calculate current SLA state when reading tickets, but normal `GET` operations should not repeatedly create duplicate audit records.

The system must avoid creating multiple `SLA_BREACHED` audit entries for the same ticket.

---

# 27. Ageing

Active ticket ageing is:

```text
currentTime
- createdAt
- totalPausedDuration
```

For a currently paused ticket:

```text
currentTime
- createdAt
- totalPausedDuration
- currentPausedDuration
```

This allows the UI to show active ageing separately from time spent waiting for the student.

---

# 28. Analytics Routes

Base URL:

```text
/api/analytics
```

## GET /api/analytics/kpis

Returns metrics based on the user's role.

Example:

```json
{
  "totalActive": 42,
  "unassigned": 8,
  "pendingAction": 7,
  "atRisk": 5,
  "breachedCount": 3,
  "resolvedToday": 12
}
```

### Department Admin

Metrics are restricted to their department.

### Admin

Metrics include all departments.

### Staff

Metrics can be restricted to relevant department/assigned tickets.

---

# 29. Authorization Middleware

Example middleware responsibilities:

```text
authenticateJWT
requireRole
requireDepartmentAccess
requireTicketOwner
```

Authentication:

```text
JWT → User
```

Authorization:

```text
User + Requested Resource
       ↓
Permission Check
       ↓
Allow / Reject
```

---

# 30. Backend Security Rules

The backend must never rely only on frontend role checks.

Examples:

```text
Student cannot call admin assignment endpoint successfully.

Staff cannot assign another staff member unless explicitly authorized.

Department Admin cannot access another department's tickets.

Student cannot modify another student's ticket.

Student cannot mark a ticket RESOLVED.

Student cannot reopen a ticket after 48 hours.

Staff cannot resolve without resolution notes.

Unauthorized users cannot access protected APIs.
```

---

# 31. Suggested Backend Structure

```text
server/
│
├── controllers/
│   ├── auth.controller.js
│   ├── ticket.controller.js
│   └── analytics.controller.js
│
├── middleware/
│   ├── auth.middleware.js
│   └── role.middleware.js
│
├── models/
│   ├── User.js
│   ├── Ticket.js
│   └── AuditLog.js
│
├── routes/
│   ├── auth.routes.js
│   ├── ticket.routes.js
│   └── analytics.routes.js
│
├── services/
│   ├── sla.service.js
│   └── audit.service.js
│
├── utils/
│   └── ticketId.js
│
├── db.js
├── server.js
├── .env
└── package.json
```

---

# 32. Important Backend Edge Cases

The backend must validate:

```text
1. Duplicate email registration.
2. Invalid login credentials.
3. Invalid JWT.
4. Student accessing another student's ticket.
5. Staff accessing another department.
6. Department Admin accessing another department.
7. Assigning a non-STAFF user.
8. Assigning staff from another department.
9. Invalid status transition.
10. Resolving without resolution notes.
11. Reopening after 48 hours.
12. Reopening CLOSED tickets.
13. Responding when ticket is not pending student action.
14. Duplicate SLA breach processing.
15. Duplicate assignment requests.
16. Duplicate status requests.
17. Invalid category.
18. Invalid priority.
19. Missing required ticket fields.
20. Unauthorized analytics access.
```

---

# 33. Backend Source of Truth

The following rules must be enforced server-side:

```text
Role
Department access
Ticket ownership
Ticket assignment
Status transitions
SLA calculation
SLA pause/resume
Reopen window
Resolution requirements
Audit creation
```

The frontend may hide unavailable actions for usability, but the backend must reject unauthorized operations even if a user manually calls the API.

---

# 34. Prototype Priority

Implementation priority:

```text
1. Authentication
2. RBAC
3. Ticket creation
4. Department routing
5. Ticket retrieval
6. Assignment
7. Status transitions
8. SLA calculation
9. SLA pause/resume
10. Resolution
11. Student close/reopen
12. Audit history
13. Analytics
14. Edge-case validation
```

Secondary features should only be implemented after the complete core lifecycle is working.
