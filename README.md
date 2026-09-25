# TicketManager

Student support and SLA lifecycle prototype for a college administrative helpdesk.

## 🌐 Live Deployments

- **Frontend (Netlify):** [https://ticketmanagementsystems.netlify.app/](https://ticketmanagementsystems.netlify.app/)
- **Backend API (Render):** [https://ticket-management-sytem.onrender.com](https://ticket-management-sytem.onrender.com)

> **Note:** The backend is hosted on Render's free tier and may take 30–60 seconds to spin up on the initial request after inactivity.

---
## Demo accounts

Use the accounts seeded in your MongoDB (assessment demo). Typical seeded users:

| Role | Email | Password |
| ---- | ----- | -------- |
| Student | `student@ticketmanager.com` | `Demo@123` |
| Staff (Accounts) | `staff@ticketmanager.com` | `Demo@123` |
| Department Admin (Accounts) | `accounts.admin@ticketmanager.com` | `Demo@123` |
| System Admin | `admin@ticketmanager.com` | `Demo@123` |

## Features

- **Role-based dashboards:** Student, Staff, Department Admin, and System Admin
- **Ticket creation:** Automatic department mapping and SLA assignment
- **Student-only registration:** Validation for institutional email, password confirmation, and roll number
- **Staff processing:** Priority adjustments, start work, request student action, and resolve with notes
- **Department Admin:** Assign/reassign staff, change priority, and view department KPIs
- **SLA tracking & filtering:** Filter by all, within-SLA, or breached tickets with automated CRITICAL escalation
- **System Admin:** Institution-wide queue, global analytics/KPIs, breach visibility, and audit trail
- **Secure auth:** HTTP-only cookie-based JWT authentication, role guards, and light/dark theme support
- **Audit timeline:** Append-only activity log for every ticket state transition and action

---

## Tech Stack

| Layer | Technologies |
| ----- | ------------ |
| **Frontend** | React, Vite, Tailwind CSS, JavaScript |
| **Backend** | Node.js, Express, Mongoose, JWT, bcrypt |
| **Database & Storage** | MongoDB Atlas, Cloudinary (file uploads) |
| **Hosting** | Netlify (Client), Render (API) |

---

## Architecture

```text
React SPA (client/)
    │  REST + cookies (VITE_API_URL)
    ▼
Express API (server/)
    │  Auth, tickets, users, analytics
    ▼
MongoDB (Users, Tickets, AuditLogs, Attachments, DocumentRequests)
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

Students may optionally attach a supporting PDF, JPG, JPEG, or PNG (max 2 MB) when creating a ticket. Staff, Department Admin, and Admin can request named documents on an authorized ticket. The ticket stays **PENDING_STUDENT_ACTION** and the SLA clock pauses until every waiting request is submitted or cancelled. Submitted files are stored in Cloudinary; MongoDB keeps metadata only. Accept and reject decisions, including rejection reasons and earlier uploads, remain in request history and AuditLog.

Public registration always creates a **STUDENT** account. Users cannot choose an administrative role.

## SLA policy (backend)

| Category | Department | SLA |
| -------- | ---------- | --- |
| FEES | Accounts | 48h |
| ATTENDANCE | Academic Office | 24h |
| CERTIFICATES | Registrar | 72h |
| IT_SUPPORT | IT Helpdesk | 12h |

When an active ticket passes its effective SLA deadline, the backend sets `isBreached = true`, escalates priority to **CRITICAL**, and records a single **SLA_BREACHED** audit entry.

Emails are stored lowercase in MongoDB. If login fails, verify seeded users in your database match the table above.

## How to run

git clone <https://github.com/Rajghosh786/Ticket_management_sytem.git>
cd <cd Ticket_management_sytem>

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
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

`CLOUDINARY_API_SECRET` is backend-only. Do not put it in `client/.env`.

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

## Document workflow

Students may attach an optional PDF, JPG, JPEG, or PNG up to 2 MB when creating a ticket. Staff, Department Admin, and Admin can request multiple named documents. Requests move through `PENDING`, `SUBMITTED`, `ACCEPTED`, `REJECTED`, or `CANCELLED`; rejected requests retain prior submissions and allow another upload. Document events appear in the existing audit history. While the server reports `PENDING_STUDENT_ACTION`, the frontend shows the SLA as paused; the backend remains the source of truth for pause/resume timing.
