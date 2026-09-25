# TicketManager

Student support and SLA lifecycle prototype for a college administrative helpdesk.

## Features

- Role-based dashboards: **Student**, **Staff**, **Department Admin**, **System Admin**
- Ticket creation with automatic **department** and **SLA** assignment
- Student-only registration with email, password, confirm password, and roll number validation
- Staff processing: priority changes, start work, request student action, resolve with notes
- Department Admin: assign/reassign staff, change priority, department KPIs
- Department Admin and System Admin: SLA Status filtering for all, within-SLA, or breached tickets
- System Admin: institution-wide queue, global KPIs, breach visibility, audit history
- HTTP-only cookie authentication, light/dark theme
- Append-only audit timeline

## Tech stack

| Layer | Technologies |
| ----- | ------------ |
| Frontend | React, Vite, Tailwind CSS, JavaScript |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt |
| Database | MongoDB |

## Architecture

```text
React SPA (client/)
    │  REST + cookies (VITE_API_URL)
    ▼
Express API (server/)
    │  Auth, tickets, users, analytics
    ▼
MongoDB (Users, Tickets, AuditLogs)
```

Authorization is enforced on the **backend** per role and department. The frontend only hides actions for UX.

## Roles

| Role | Scope |
| ---- | ----- |
| STUDENT | Own tickets; raise tickets; respond to pending actions; close/reopen own tickets |
| STAFF | Department tickets; process assigned work |
| DEPARTMENT_ADMIN | Manage department queue; assign staff; change priority |
| ADMIN | View all departments; global KPIs and SLA breach visibility (read-focused UI) |

## Ticket lifecycle

```text
OPEN → IN_PROGRESS → PENDING_STUDENT_ACTION → IN_PROGRESS → RESOLVED → CLOSED
                                                              ↓ (48h)
                                                           REOPENED → IN_PROGRESS
```

Students confirm closure from **RESOLVED**. Reopen is from **CLOSED** within 48 hours (backend enforced).

New student tickets start as **OPEN** with priority **MEDIUM** (students do not set priority). Staff and Department Admin can reprioritize tickets, and an SLA breach can escalate priority to **CRITICAL**.

Public registration always creates a **STUDENT** account. Users cannot choose an administrative role.

## SLA policy (backend)

| Category | Department | SLA |
| -------- | ---------- | --- |
| FEES | Accounts | 48h |
| ATTENDANCE | Academic Office | 24h |
| CERTIFICATES | Registrar | 72h |
| IT_SUPPORT | IT Helpdesk | 12h |

When an active ticket passes its effective SLA deadline, the backend sets `isBreached = true`, escalates priority to **CRITICAL**, and records a single **SLA_BREACHED** audit entry.

## Demo accounts

Use the accounts seeded in your MongoDB (assessment demo). Typical seeded users:

| Role | Email | Password |
| ---- | ----- | -------- |
| Student | `student@ticketmanager.com` | `Demo@123` |
| Staff (Accounts) | `staff@ticketmanager.com` | `Demo@123` |
| Department Admin (Accounts) | `accounts.admin@ticketmanager.com` | `Demo@123` |
| System Admin | `admin@ticketmanager.com` | `Demo@123` |

Emails are stored lowercase in MongoDB. If login fails, verify seeded users in your database match the table above.

## How to run

### Backend (`server/`)

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
ATLAS_URI=<mongodb-connection-string>
JWT_SECRET=<secret>
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

### Frontend (`client/`)

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

## Documentation

- `.ai/` — project specifications and AI development rules
- `READ_ME.md` — extended product overview
- `AI_USAGE.md` — mandatory AI usage report

## AI usage

See [AI_USAGE.md](./AI_USAGE.md) for tool usage, corrections, and fixes applied during development.
