# TicketManager — Student Support & SLA Lifecycle Engine

## Overview

TicketManager is a student support and ticket management system designed for higher education institutions.

Students can raise administrative requests such as fees, attendance, certificates, and IT support. Tickets are automatically routed to the appropriate department, assigned to staff, tracked against category-based SLAs, and maintained with a complete activity history.

The system provides separate workflows for Students, Staff, Department Admins, and System Admins.

## Key Features

* **Ticket Management** — Students can raise and track support requests.
* **Department Routing** — Tickets are automatically routed based on category.
* **Role-Based Access Control** — Separate permissions for Students, Staff, Department Admins, and Admins.
* **Category-Based SLA** — Different request categories have different resolution targets.
* **SLA Pause** — SLA time pauses while waiting for information from the student.
* **Ageing & SLA Visibility** — Tickets show active ageing, remaining SLA time, and breach status.
* **Escalation** — Breached tickets are highlighted and surfaced to management.
* **Assignment** — Department Admins assign tickets to department Staff (System Admin monitors assignments).
* **Pending-Action Workflow** — Staff can request additional information from students.
* **Resolution Tracking** — Resolved tickets require resolution notes.
* **Student Confirmation** — Students can confirm a resolution or reopen a recently resolved ticket.
* **Immutable Audit History** — Important ticket actions and status changes are recorded.
* **Management Dashboard** — Admins can monitor ticket volume, pending work, SLA breaches, and resolution status.

---

## Ticket Categories & SLA

| Category     | Department      |      SLA |
| ------------ | --------------- | -------: |
| FEES         | Accounts        | 48 hours |
| ATTENDANCE   | Academic Office | 24 hours |
| CERTIFICATES | Registrar       | 72 hours |
| IT_SUPPORT   | IT Helpdesk     | 12 hours |

These values are prototype business rules and can be configured later.

---

## User Roles

### Student

* Create tickets
* View own tickets
* Respond to information requests
* View ticket activity
* Review resolution
* Confirm and close resolved tickets
* Reopen a closed ticket within 48 hours of closure

### Staff

* View tickets assigned to them
* View tickets in their department
* Start investigation
* Request additional information
* Update ticket status
* Resolve tickets
* Add resolution notes

### Department Admin

* View tickets belonging to their department
* Assign tickets to department staff
* Change priority
* Monitor SLA status
* Monitor ageing and breached tickets
* View department activity history

### Admin

* View tickets across all departments
* Monitor global KPIs and SLA breaches
* Monitor SLA breaches and ageing
* View global activity history

---

## Priority vs SLA

Ticket priority and SLA status are separate concepts.

**Priority** represents the business importance of a request:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

**SLA status** represents operational timing:

```text
WITHIN_SLA
AT_RISK
BREACHED
```

An SLA breach does not automatically change the ticket's business priority.

Instead, breached tickets are escalated and surfaced prominently to management.

---

## Ticket Lifecycle

```text
STUDENT
   │
   │ Create Ticket
   ▼
OPEN
   │
   │ Department Routing
   ▼
DEPARTMENT QUEUE
   │
   │ Department Admin / Admin assigns Staff
   ▼
IN_PROGRESS
   │
   ├─────────────────────────────┐
   │                             │
   │ More information needed     │ Resolution ready
   ▼                             ▼
PENDING_STUDENT_ACTION         RESOLVED
   │                             │
   │ Student responds            │ Student reviews
   ▼                             ▼
IN_PROGRESS                  ┌────┴────┐
                             │         │
                             ▼         ▼
                           CLOSED   REOPENED
                                      │
                                      ▼
                                  IN_PROGRESS
```

---

## SLA Lifecycle

```text
                     TICKET CREATED
                           │
                           ▼
                    Calculate SLA
                           │
                           ▼
                  Track Active Time
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
       Within SLA                    SLA Exceeded
             │                           │
             ▼                           ▼
        Normal / At Risk              BREACHED
                                         │
                                         ▼
                                  Admin Escalation
```

When a ticket enters `PENDING_STUDENT_ACTION`, the SLA clock pauses.

When the student responds, the SLA clock resumes with the remaining active SLA time.

Time spent waiting for the student does not count toward active SLA ageing.

---

## Demo Accounts

The public registration flow creates **Student accounts only**.

The following demo accounts are provided for assessment and demonstration:

| Role                     | Email                               | Password   |
| ------------------------ | ----------------------------------- | ---------- |
| Student                  | `student@ticketmanager.com`         | `Demo@123` |
| Staff (Accounts)         | `staff@ticketmanager.com`           | `Demo@123` |
| Department Admin         | `accounts.admin@ticketmanager.com`  | `Demo@123` |
| System Admin             | `admin@ticketmanager.com`           | `Demo@123` |

> Demo credentials are intended only for local assessment/demo usage.

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
### Backend

* Node.js
* Express.js
* REST API
* JWT Authentication

### Database

* MongoDB
* Mongoose

---

## Quick Start

### Prerequisites

* Node.js 18+
* MongoDB Atlas or local MongoDB

### 1. Clone the repository

```bash
git clone <repository-url>
cd TicketManager
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `.env`:

```env
PORT=5000
ATLAS_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

---

## Recommended Demo Flow

For the quickest evaluation:

```text
1. Login as Student
2. Create a FEES ticket
3. Login as Finance Department Admin
4. Assign the ticket to Finance Staff
5. Login as Finance Staff
6. Move ticket to IN_PROGRESS
7. Request student information
8. Login as Student
9. Respond to the request
10. Login as Staff
11. Resolve the ticket with resolution notes
12. Login as Student
13. Confirm and close the ticket
14. Login as Admin
15. Review ticket history and SLA/management metrics
```

---

## Project Documentation

* `flow.md` — System flow and business rules
* `README.md` — Project overview and setup
* `AI_USAGE.md` — Mandatory AI usage report

---

## Engineering Notes

The prototype intentionally focuses on the core support lifecycle rather than adding secondary features such as real-time chat, email notifications, file storage, or complex workflow automation.

The primary goal is to demonstrate:

* Product understanding
* Clear ticket lifecycle
* Role-based permissions
* SLA handling
* Ownership and assignment
* Auditability
* Management visibility
* Validation and edge-case handling
