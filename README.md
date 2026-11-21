# SmartSchools

SmartSchools is a connected school platform for academics, AI-supported learning, teaching, school operations, families, and future pathways.

## Monorepo

- `apps/web` — Next.js public website, school discovery, onboarding preview and tenant-branded role entry.
- `apps/platform-console` — Internal SmartSchools operations dashboard prototype (not connected to live data).
- `apps/api` — NestJS modular backend foundation.
- `packages/*` — Shared contracts and UI can be added here as product surfaces grow.
- `infra` — Local development services and deployment infrastructure.

School-facing roles share one Next.js app and school portal entry, while the platform operator console is a separate app. This keeps school identity, navigation and access flows together while isolating the higher-privilege platform surface.

## Get started

Requirements: Node.js 20.9+, npm, and Docker (for local data services).

```bash
npm install
cp .env.example .env
npm run dev
```

The website and school entry run at `http://localhost:3000`; the platform console prototype runs at `http://localhost:3002`; the API health endpoint is `http://localhost:4000/api/health`.

Start local Postgres (with pgvector) and Redis when needed:

```bash
npm run infra:up
```

## Product direction

Build in stages: tenant provisioning and secure school membership; school structure; curriculum intelligence; assessment and mastery; personalized learning and teacher tools; student and family experiences; then operations, finance, and physical innovation infrastructure. Curriculum extraction, official assessment outcomes, and AI-generated teaching resources require human review and approval.

## What the school infrastructure looks like

### School discovery and workspace access

- `/schools` is the school finder; `/s/[schoolSlug]` is the school-branded workspace chooser. The current directory contains sample schools only.
- `/schools/new` previews school onboarding. It does not create a tenant or save or send submitted details.
- A production directory should list only schools that opt in to discovery; private schools should be reachable by their school-provided code or link.
- A school UUID is an internal identifier. A public slug or school code helps find the school but is never a password. Authentication must verify the user's active school membership and role after school selection.
- Workspace choices include school administrator, teacher, student and parent/guardian. Transport access is enabled per school rather than shown as a universal role.
- `apps/platform-console` shows illustrative metrics and records only. It must not be exposed as an operational console until platform authentication, authorization, tenant provisioning and audit logging are implemented.

The sign-in screen is intentionally non-functional until identity and membership checks are connected. Do not enter real credentials in the preview.

The school is the shared source of truth behind each role-based workspace. The core hierarchy is:

`Platform → Organisation / School Group → School → Campus → Academic Year → Term → Section → Grade → Class Arm`

Enrolments connect students to class arms for a specific academic year. Subject offerings connect subjects to classes and terms; teacher assignments and timetables connect staff to those offerings. Lessons, classroom activities, assignments, assessments, attendance and progress records are attached to the appropriate class, term and student. Access is scoped by a person's role and school relationship; families need verified links to each child.

### Curriculum to teacher-approved lesson

1. A school uploads an approved curriculum or scheme of work (PDF, DOCX, XLSX or manual entry).
2. Background parsing extracts classes, subjects, terms, weeks, topics, subtopics, objectives and assessment guidance. Each extracted item retains its source and curriculum version.
3. Staff review and correct the draft. Only approved curriculum becomes available to teaching and learning tools.
4. A teacher selects a class, subject, week and topic to draft a lesson note with objectives, prior knowledge, explanations, examples, activities, teaching aids, differentiation and assessment.
5. The teacher edits and approves the note before sharing or assigning it. If the underlying curriculum changes, linked lesson resources are flagged for review rather than silently replaced.

The AI should ground its output in the approved curriculum and the selected class context. It drafts and explains; it does not publish teaching material, assign official grades or make permanent judgements about a student on its own.

### Teachers, smart classes and student learning

Teacher profiles, campus membership, subject/class assignments and timetables make up the teaching workspace. A scheduled class session links its teacher, class roster, subject and lesson. During the session, teachers can present resources, run activities, polls, quizzes or assignments, and record attendance. Student submissions and teacher feedback create evidence for topic-level progress and mastery. Recommendations can then suggest practice or a teacher intervention; teachers retain control of official outcomes.

The student workspace builds from that same class and curriculum data: today's lessons, assigned work, guided practice, feedback and a revisable learning plan. The family workspace is a separate, permission-scoped view of linked children's progress, attendance and school communications.

### Attendance and fees

- **Attendance:** record present, late, absent or excused against a class session; retain who recorded or changed it; and send appropriate updates to verified family contacts. Manual attendance is the simplest first release, with QR or device integrations later.
- **Fees:** create term-based invoices and charges linked to a student and school; let verified family accounts view statements and receipts; record payment attempts, confirmations, refunds and reconciliation as auditable events. A payment provider handles card or bank details—SmartSchools should not store raw payment credentials. Installments, reminders, family wallets and payroll are later phases.

### Shared technical foundation

The intended backend is a NestJS modular monolith with tenant-aware identity and role permissions. PostgreSQL stores school operations and academic records; pgvector can support curriculum retrieval; private object storage holds source documents and student artifacts; Redis/BullMQ handles parsing, recalculation and notifications. Audit logs capture sensitive record changes, approvals and AI activity. Production also needs managed database, storage, queue and notification services—local Docker Compose is for development only.

## Deployment

The Next.js website and school entry (`apps/web`) are deployed at [smartschool-os-chi.vercel.app](https://smartschool-os-chi.vercel.app). Its Vercel project uses `apps/web` as the Root Directory. The school directory currently contains sample records, and the school sign-in is a non-functional preview.

The Platform Console (`apps/platform-console`) runs locally at `http://localhost:3002` and is not deployed. It contains illustrative data only and must not be exposed as an operational console until platform authentication, authorization, provisioning and auditing are implemented.

The NestJS API (`apps/api`) is deployed separately at [smartschools-api.vercel.app](https://smartschools-api.vercel.app), with `apps/api` as its Root Directory and GitHub deployments enabled from `main`. Its production `WEB_ORIGIN` is set to the website origin for CORS. The API currently provides only `/api/health`; it has no database, identity or school workflows yet. Managed data services and production environment variables are required before implementing those workflows. Do not use the development credentials in `.env.example` in production.

## Suggested delivery order

1. School organisation, campuses, academic years, classes, identity and scoped permissions.
2. Curriculum upload, extraction provenance, versioning and staff approval.
3. Teacher assignments, timetable, lesson drafts and teacher approval.
4. Smart classroom sessions, student activities, assessments and mastery evidence.
5. Verified family links, student/family views and attendance notifications.
6. Fee statements, payment-provider integration and reconciliation.
7. Deeper transport, devices, labs and innovation-space integrations.
