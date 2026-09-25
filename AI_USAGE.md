# AI Usage Report — TicketManager

## AI TOOL USED

- **ChatGPT** — Product planning, system-flow design, business-rule definition, architecture discussions, prompt writing, documentation planning, and reviewing implementation decisions.
- **Gemini** — Product planning, workflow discussions, prompt writing, and implementation planning.
- **Cursor** — AI-assisted coding in the IDE, including multi-step implementation prompts for authentication, role-based dashboards, ticket workflows, SLA handling, document workflows, and UI improvements.

AI output was reviewed and validated during development. Generated code was inspected and modified where required to match the project's business rules, existing architecture, and assignment requirements.

## WHAT I ASKED AI TO DO

- Help define the product requirements, user roles, ticket lifecycle, SLA rules, escalation workflow, document-request workflow, and edge cases.
- Help design the system flow, frontend/backend architecture, database models, REST APIs, and implementation plan.
- Write and refine implementation prompts for AI-assisted development.
- Implement authentication using JWT with HTTP-only cookies and student registration.
- Build role-based dashboards and workflows for Student, Staff, Department Admin, and System Admin.
- Implement ticket creation, assignment, status transitions, priority management, SLA tracking, breach handling, and audit history.
- Implement student document attachments and staff/admin document-request workflows using Multer and Cloudinary.
- Implement SLA pause/resume behavior while tickets are waiting for student action.
- Implement light/dark theme and consistent UI/UX across the application.
- Update project documentation, including README, system flow, frontend/backend specifications, and AI usage documentation.
- Perform incremental UI and functionality improvements while preserving the existing application architecture.

## PROMPT THAT WAS MOST USEFUL

> Read the existing project documentation and inspect the current implementation before making changes. Implement the requested functionality incrementally using the existing architecture. Treat the documented business rules as the source of truth. Do not rewrite working authentication or unrelated functionality, do not change the technology stack, do not invent APIs or fields that are not required, and keep authorization on the backend. Make only the requested changes and preserve existing working functionality.

## PROMPTS THAT WERE USEFUL

### Prompt 1 — Authentication and Initial Dashboard

> Read the existing project documentation and inspect the current frontend and backend before making changes. Implement authentication using the existing backend architecture with JWT stored in HTTP-only cookies. Create the login flow and role-based dashboard entry for Student, Staff, Department Admin, and Admin. Do not rewrite existing authentication logic, do not change the project stack, and do not create unnecessary abstractions. Preserve existing functionality and make only the requested changes.

### Prompt 2 — Role-Based Ticket Workflow

> Implement the TicketManager workflow incrementally for the existing roles: Student, Staff, Department Admin, and Admin. Follow the existing flow.md and backend specification as the source of truth. Students can create tickets but cannot set priority. Staff can process department tickets, request student action, and resolve tickets. Department Admin can assign/reassign staff and manage department tickets. Admin has institution-wide visibility. Enforce authorization on the backend and do not rely on frontend checks for security. Do not rewrite working authentication or unrelated functionality.

### Prompt 3 — SLA and Ticket Lifecycle

> Implement the SLA lifecycle according to the existing business rules. SLA duration must be determined by ticket category on the backend. The backend is the source of truth for SLA timing and breach detection. When an active ticket breaches its SLA, mark it breached and escalate priority to CRITICAL. Implement PENDING_STUDENT_ACTION with SLA pause/resume behavior. Students must not be able to resolve tickets or change priority. Preserve the existing ticket lifecycle, authorization, and audit history.

### Prompt 4 — Document Request and Upload Workflow

> Implement the document workflow without changing the existing ticket lifecycle. Students may upload supported documents within the configured file-size limit. Staff, Department Admin, and Admin can request named documents from authorized tickets. A ticket waiting for student action must enter PENDING_STUDENT_ACTION and pause its SLA. Students must be required to provide requested documents before submitting the response. Support document rejection with a mandatory reason and allow re-upload while preserving previous submissions and audit history. Use Multer for backend upload validation and Cloudinary for file storage. Store document metadata in MongoDB rather than the binary file.

### Prompt 5 — UI Consistency and Final Improvements

> Improve the existing TicketManager UI without rebuilding the application or changing its business logic. Apply one consistent visual system across login, registration, student dashboard, staff dashboard, department admin dashboard, admin dashboard, ticket details, document requests, forms, tables, modals, and dropdowns. Maintain the existing light/dark theme and use the established color palette consistently. Replace generic browser dropdown styling with consistent application-styled dropdowns. Add appropriate validation and user-facing errors where required. Do not modify working authentication, backend APIs, or business rules unless required to fix an identified issue.

## CODE GENERATED BY AI

- Significant portions of `client/src/`, including authentication UI, registration UI, role-based dashboards, ticket forms, ticket detail views, document-request UI, shared components, theme handling, and API service integration.
- Significant portions of `server/`, including authentication logic, ticket controllers, ticket routes, role-based authorization, SLA handling, analytics, document-request functionality, file-upload handling, and related Mongoose models.
- Initial project documentation and specifications, including `README.md`, `flow.md`, frontend/backend specifications, and AI usage documentation.
- UI improvements including consistent styling, dark/light theme support, modals, forms, tables, dropdowns, validation messages, and document upload interfaces.

## CODE MODIFIED

- Adjusted generated code to match the project's existing structure and business rules.
- Fixed role and permission behavior where required.
- Adjusted frontend validation and UI behavior for specific requirements.
- Made minor changes to API integration and shared components during development.

## AI OUTPUT THAT WAS WRONG

1. **Student ticket access** — A generated ownership check caused students to receive a `403` when opening their own ticket because the populated `studentId` value was compared incorrectly.

2. **Demo account documentation** — The generated README initially contained demo account emails that did not match the accounts actually seeded in MongoDB.

3. **Pending ticket workflow** — The initial implementation allowed Staff to move a ticket from `PENDING_STUDENT_ACTION` back to `IN_PROGRESS` without requiring the student to respond first.

## HOW THE PROBLEM WAS IDENTIFIED

- Tested the student ticket flow and found that opening a student's own ticket returned `403`.
- Compared the demo account details in the README with the actual users stored in MongoDB.
- Reviewed the ticket lifecycle and noticed that the pending-student-action flow did not require a student response before continuing.

## HOW IT WAS FIXED

- Corrected the student ticket ownership check to handle the populated `studentId` correctly.
- Updated the README demo accounts to match the actual seeded users.
- Added the required student response flow and prevented Staff from directly moving a ticket from `PENDING_STUDENT_ACTION` to `IN_PROGRESS`.
