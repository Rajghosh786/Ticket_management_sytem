# TicketManager — AI Development Rules

## 1. Project Identity

Project name: TicketManager

Do not rename the project or introduce another product name.

---

## 2. Technology Stack

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
- Lucide React

### Backend
- Node.js
- Express.js
- JavaScript
- MongoDB
- Mongoose
- JWT
- bcrypt

Do not convert the project to TypeScript.

Do not introduce another framework or database unless explicitly requested.

---

## 3. Project Structure

Frontend code belongs in:

client/

Backend code belongs in:

server/

Do not create a root package.json or root node_modules.

Do not move frontend dependencies into server/.
Do not move backend dependencies into client/.

---

## 4. Package Installation

AI must NOT install packages or run npm commands.

If a package is required, tell the developer the exact command and where it should be run.

Example:

cd client
npm install <package>

or:

cd server
npm install <package>

Never install dependencies in the project root.

---

## 5. Before Making Changes

Before modifying code:

1. Read this file.
2. Read the relevant specification.
3. Inspect the existing implementation.
4. Reuse existing code where appropriate.
5. Make only the requested change.
6. Preserve working functionality.

Do not assume that the existing implementation matches an imagined architecture.

---

## 6. Source of Truth

Use the specifications as follows:

flow.md
→ Product workflow and business rules

frontend.md
→ Frontend behavior and UI requirements

backend.md
→ Database schemas, APIs, authorization and backend behavior

PROJECT_RULES.md
→ Engineering and AI-development rules

If these documents conflict, do not silently invent a solution. Ask the developer.

---

## 7. No Hallucinated Requirements

Do not invent:

- APIs
- database fields
- roles
- permissions
- workflows
- pages
- integrations
- services
- technologies

unless explicitly requested or required by an existing specification.

If something is genuinely required for implementation but unspecified, choose the simplest reasonable implementation and clearly mention the assumption.

For decisions that affect business logic, security, database structure or API contracts, ask before making the decision.

---

## 8. Roles

TicketManager uses exactly these roles:

- STUDENT
- STAFF
- DEPARTMENT_ADMIN
- ADMIN

Do not create additional roles.

Do not merge roles.

Role permissions must follow backend.md.

---

## 9. Backend Is the Authority

The frontend may hide actions based on role for UX.

This is NOT security.

Every permission must be enforced by the backend.

Examples:

- Student cannot assign tickets.
- Staff cannot perform admin-only operations.
- Department Admin cannot access another department's tickets.
- Student can only access their own tickets.

Never rely on frontend checks for authorization.

---

## 10. Business Rules

Do not implement ticket behavior differently from flow.md.

This includes:

- ticket statuses
- assignment
- department routing
- SLA calculation
- SLA pause/resume
- breach detection
- resolution
- closing
- reopening
- audit history

Do not create alternative workflows.

---

## 11. Code Style

Write straightforward JavaScript that a junior/fresher developer can understand and explain.

Prefer:

- simple functions
- clear names
- small components
- direct API calls
- simple state management

Avoid:

- unnecessary abstractions
- unnecessary libraries
- over-engineering
- complex design patterns
- clever code

---

## 12. UI

Use Tailwind CSS for styling.

Keep the interface:

- clean
- professional
- responsive
- consistent
- practical for a college support system

Do not introduce a new UI framework unless explicitly requested.

---

## 13. Error Handling

Do not silently ignore errors.

Handle:

- API failures
- authentication failures
- validation errors
- unauthorized actions
- loading states

Do not expose sensitive backend errors or stack traces to users.

---

## 14. Validation

After making changes, validate what was actually changed.

Do not claim:

"tested", "working", "build passed", or "fixed"

unless it was actually verified.

If something could not be tested, state that clearly.

---

## 15. Scope Control

This is a time-limited assessment.

Prioritize the complete TicketManager workflow over additional features.

Do not add unrelated functionality such as:

- payments
- subscriptions
- chat
- notifications
- AI features
- external integrations
- unnecessary real-time systems
- unnecessary infrastructure

unless explicitly requested.

---

## 16. Implementation Principle

When asked to implement something:

Understand → Inspect → Implement → Validate.

Do not rewrite large portions of the application when a smaller change is sufficient.

The objective is a working, explainable TicketManager prototype—not an over-engineered enterprise system.