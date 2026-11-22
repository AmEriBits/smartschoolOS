# SmartSchools

SmartSchools is a connected school platform for academics, AI-supported learning, teaching, school operations, families, and future pathways.

## Monorepo

- `apps/web` — Next.js public website, school discovery, authenticated school applications and tenant role entry.
- `apps/platform-console` — Internal SmartSchools operations console for authorized application review and tenant activation.
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

The website and school entry run at `http://localhost:3000`; the platform console runs at `http://localhost:3002`; the API health endpoint is `http://localhost:4000/api/health`.

Start local Postgres (with pgvector) and Redis when needed. Postgres is published on port `55432` by default to avoid common host PostgreSQL conflicts:

```bash
npm run infra:up
npm run db:migrate --workspace=@smartschools/api
```

### Supabase setup

The onboarding flow uses Supabase Auth and PostgreSQL. Create a Supabase project, then configure:

- In the repository-root `.env`, set `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WEB_ORIGIN`, and `SCHOOL_PORTAL_ORIGIN`. Use the Supabase pooler URL for `DATABASE_URL` in serverless deployments and a direct or session-pooler URL for `DIRECT_URL` migrations. The service-role key is server-only and must never use a `NEXT_PUBLIC_` name. `SUPABASE_ANON_KEY` remains a supported legacy alternative to `SUPABASE_PUBLISHABLE_KEY`.
- In the web and Platform Console runtime environments, set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains a supported legacy alternative. For local Next.js development, put these in `apps/web/.env.local` and `apps/platform-console/.env.local`; use Vercel environment settings for deployments.
- Enable email sign-in and add local and production app URL patterns to Supabase Auth’s allowed redirect URLs. School-admin invitations return to `/s/{schoolSlug}/workspace/school-admin`.
- Configure API CORS `WEB_ORIGIN` with the allowed public web and console origins, separated by commas. Set `SCHOOL_PORTAL_ORIGIN` to the single origin that serves school sign-in and invitation callbacks; it is also allowed by API CORS.

Create the first platform operator by signing that person up in Supabase Auth, then set their Auth user UUID and email as `PLATFORM_OPERATOR_USER_ID` and `PLATFORM_OPERATOR_EMAIL` in `.env` and run:

```bash
npm run db:seed-operator --workspace=@smartschools/api
```

Only seeded, active operator accounts can review or provision schools. Approval creates a private onboarding tenant. The first administrator is either assigned from the verified applicant account or invited to the administrator email entered on the application. The tenant becomes publicly discoverable only after its administrator accepts access and an operator activates the school.

## Product direction

Build in stages: tenant provisioning and secure school membership; school structure; curriculum intelligence; assessment and mastery; personalized learning and teacher tools; student and family experiences; then operations, finance, and physical innovation infrastructure. Curriculum extraction, official assessment outcomes, and AI-generated teaching resources require human review and approval.

### Master principle

**Build the common foundation once. Let every SmartSchools module reuse it.** Add capabilities through bounded modules and replaceable integrations, rather than rebuilding identity, student data, curriculum, or permissions for each feature. Shared services should have clear contracts and tenant-aware access controls so product modules can evolve independently without fragmenting the platform's source of truth.

### Shared intelligence layer

AI and analytics are shared platform capabilities, not isolated feature implementations. Product modules use the common intelligence layer and approved, permission-scoped data:

- **Curriculum ingestion and knowledge engine:** turn approved curricula and resources into structured, versioned, searchable knowledge with source provenance.
- **Curriculum knowledge graph:** represent subjects, topics, concepts, objectives, skills, prerequisites, and cross-subject relationships.
- **Student learning model:** maintain mastery estimates, learning history, misconceptions, interests, and evidence-backed progress.
- **Assessment intelligence:** interpret assessment outcomes and estimate topic and concept mastery.
- **Recommendation engine:** select appropriate next learning actions, practice, resources, and teacher interventions.
- **AI tutor and specialist agents:** provide curriculum-grounded tutoring, teacher support, assessment assistance, project support, and pathway exploration.
- **Retrieval-augmented generation (RAG):** retrieve approved curriculum and school resources to ground AI responses.
- **AI orchestration:** route requests across replaceable model providers and manage prompts, context, cost, retries, and evaluation.
- **Teacher intelligence:** surface class trends, students who may need support, and relevant resource suggestions.
- **Analytics:** provide academic, engagement, attendance, financial, and operational insights.
- **Optimisation engines:** solve timetable constraints and optimise transport routes and estimated arrival times.
- **AI safety and evaluation:** apply age-appropriate controls, evaluate and monitor outputs, and support human review and escalation.

Keep student models evidence-based and appropriately scoped; AI recommendations support learners and educators but do not replace teacher judgement or make unreviewed official decisions.

## What the school infrastructure looks like

### School discovery and workspace access

- `/schools` lists active, discoverable schools from the API; `/s/[schoolSlug]` is the school-branded workspace chooser.
- `/schools/new` requires a verified Supabase account and persists a school application in PostgreSQL.
- The Platform Console reviews applications, provisions private tenants, records audit events, invites the first administrator, retries failed invitations, and activates schools.
- Public school discovery returns only active, discoverable tenants. Invited administrators can reach a private workspace through their invitation link without exposing that school in the public directory.
- A school UUID is an internal identifier. A public slug or school code helps find the school but is never a password. Authentication must verify the user's active school membership and role after school selection.
- Workspace choices include school administrator, teacher, student and parent/guardian. Transport access is enabled per school rather than shown as a universal role.
- The Platform Console UI requires Supabase sign-in, and all platform data/actions are separately protected by the API’s operator allowlist.
- The initial sign-in flow verifies school membership. Full academic and operational dashboards are subsequent build phases.
- Active school administrators can open `/s/{schoolSlug}/workspace/school-admin/setup` to create campuses, academic years and terms, grades, class arms, subjects, and subject offerings. The `/s/{schoolSlug}/workspace/school-admin/people` workspace adds school-scoped student roster profiles and class-year enrolments, teacher invitations, and teacher assignments to subject offerings. Student profiles do not require a student email or login; family linking and student access are separate future capabilities. People changes are administrator-only and audited.

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

The student workspace builds from that same class and curriculum data: today's lessons, assigned work, guided practice, feedback and a revisable learning plan. The family workspace is a separate, permission-scoped view where a parent or guardian can follow each verified linked child's progress, attendance and school communications.

### Attendance and fees

- **Attendance:** record present, late, absent or excused against a class session; retain who recorded or changed it; and send appropriate updates to verified family contacts. Manual attendance is the simplest first release, with QR or device integrations later.
- **Fees:** create term-based invoices and charges linked to a student and school; let verified parents or guardians pay through an integrated payment provider and view statements and receipts for each linked child; record payment attempts, confirmations, refunds and reconciliation as auditable events. A payment provider handles card or bank details—SmartSchools should not store raw payment credentials. Installments, reminders, family wallets and payroll are later phases.

### Shared technical foundation

The intended backend is a NestJS modular monolith with tenant-aware identity and role permissions. PostgreSQL stores school operations and academic records; pgvector can support curriculum retrieval; private object storage holds source documents and student artifacts; Redis/BullMQ handles parsing, recalculation and notifications. Audit logs capture sensitive record changes, approvals and AI activity. Production also needs managed database, storage, queue and notification services—local Docker Compose is for development only.

## Deployment

The Next.js website and school entry (`apps/web`) are deployed at [smartschool-os-chi.vercel.app](https://smartschool-os-chi.vercel.app). Its Vercel project uses `apps/web` as the Root Directory. Configure its public API and Supabase Auth variables before using onboarding or sign-in.

The Platform Console (`apps/platform-console`) runs locally at `http://localhost:3002` and is not deployed. Deploy it only after setting its public API/Auth variables and confirming the API’s operator allowlist and CORS configuration.

The NestJS API (`apps/api`) is deployed separately at [smartschools-api.vercel.app](https://smartschools-api.vercel.app), with `apps/api` as its Root Directory and GitHub deployments enabled from `main`. Configure `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `WEB_ORIGIN` in its production environment. Use the Supabase pooler URL for `DATABASE_URL` and a direct or session-pooler URL for `DIRECT_URL`; apply migrations from a trusted environment with `npm run db:deploy --workspace=@smartschools/api`. Do not use the development credentials in `.env.example` in production.

## Suggested delivery order

1. School organisation, campuses, academic years, classes, identity and scoped permissions.
2. Curriculum upload, extraction provenance, versioning and staff approval.
3. Teacher assignments, timetable, lesson drafts and teacher approval.
4. Smart classroom sessions, student activities, assessments and mastery evidence.
5. Verified family links, student/family views and attendance notifications.
6. Fee statements, payment-provider integration and reconciliation.
7. Deeper transport, devices, labs and innovation-space integrations.
