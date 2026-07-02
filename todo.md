# Utility IQ — Project TODO

## Phase 1: Design System & App Shell
- [x] Global CSS with IOT.nxt dark brand theme (colors, fonts, tokens)
- [x] Google Fonts integration (Inter + Space Grotesk)
- [x] App shell with sidebar navigation and DashboardLayout
- [x] Landing / login page
- [x] Route structure in App.tsx

## Phase 2: Database Schema
- [x] organisations table (multi-tenant)
- [x] organisation_members table (user-org membership + role)
- [x] assessment_templates table
- [x] domains table (8 fixed domains)
- [x] capabilities table (per domain)
- [x] level_descriptors table (1-5 per capability)
- [x] assessments table (lifecycle: Draft, In-Progress, Under Review, Approved)
- [x] assessment_participants table
- [x] score_responses table (current, target, confidence, justification, doc_ref)
- [x] consensus_scores table (facilitator override)
- [x] result_snapshots table
- [x] roadmap_items table (4 horizons)
- [x] audit_log table
- [x] Extend users table with platform_role field

## Phase 3: Backend tRPC Routers
- [x] organisations router (CRUD, member management, role assignment)
- [x] templates router (list, get with domains/capabilities/descriptors)
- [x] assessments router (create, update lifecycle, get with participants)
- [x] scoring router (submit score, get scores, variance detection)
- [x] consensus router (facilitator score capture)
- [x] results router (scoring engine, domain scores, overall score, gap analysis)
- [x] roadmap router (generate roadmap items from gaps, CRUD)
- [x] audit router (log events, list per assessment)
- [x] admin router (platform owner: manage orgs, users, templates)
- [x] Template seed router (seed default 8-domain Energy Maturity template)

## Phase 4: Frontend Pages
- [x] Landing/Login page
- [x] Main dashboard (org overview, active assessments, KPI cards)
- [x] Assessment list page
- [x] Create assessment page
- [x] Assessment scoring workspace (per capability, per domain)
- [x] Results dashboard (radar chart, bar chart, heatmap, gap analysis)
- [x] Roadmap page (4 horizons, prioritised items)
- [x] Board report page (print-to-PDF)
- [x] Audit log page
- [x] Admin panel (Platform Owner: orgs, users, templates)
- [x] Organisation settings page

## Phase 5: Data Visualisations & Polish
- [x] Radar/spider chart (Recharts)
- [x] Domain bar chart (current vs target)
- [x] Heatmap grid (capability × score × variance)
- [x] Gap analysis view
- [x] Smooth page transitions and micro-animations
- [x] PDF print stylesheet
- [x] Empty states and loading skeletons
- [x] EMS level mapping cards
- [x] Health check endpoint for Railway

## Phase 6: Testing & Delivery
- [x] Vitest unit tests for scoring engine (17 tests)
- [x] Vitest unit tests for roadmap generator
- [x] Railway.app deployment config (railway.json + RAILWAY_DEPLOY.md)
- [x] Final checkpoint

## Future Phases (Intentionally Deferred)
- [x] Phase 2: Facilitator sign-off workflow with email notifications — deferred to Phase 2 roadmap
- [x] Phase 2: Assessment invitation links for external assessors — deferred to Phase 2 roadmap
- [x] Phase 3: File upload evidence (S3) — removed by design decision (lightweight evidence reference used instead)
- [x] Phase 3: Custom assessment templates (admin template builder) — deferred to Phase 2 roadmap
- [x] Phase 3: Benchmark comparisons across organisations — deferred to Phase 2 roadmap

## Railway Deployment Fix — Self-Contained Auth
- [x] Replace Manus OAuth with self-contained email/password JWT auth (no external OAuth dependency)
- [x] Add password_hash column to users table via migration
- [x] Build /api/auth/register, /api/auth/login, /api/auth/logout REST endpoints
- [x] Update frontend login/signup page to use email/password form
- [x] Remove all OAUTH_SERVER_URL / VITE_OAUTH_PORTAL_URL dependencies from server
- [x] Test production build locally and push to GitHub

## Critical Workflow Fixes
- [x] Admin Panel: Organisation detail view with member list and Add Member UI (search user by email, assign role)
- [x] Admin Panel: Remove member from organisation
- [x] Dashboard: Empty state for users with no organisation memberships (already handled)
- [x] Assessment workspace: Auto-add creator as facilitator participant when assessment is created
- [x] AssessmentList page: Show assessments for the user's organisations correctly
- [x] Org Settings: Member management tab for Org Admins
- [x] Fix platform_owner permission bypass for org.get, org.members, org.addMember, assessments.create

## Bug Fixes — Session 2
- [x] BUG 1: Verify createAssessment insertId fix is in working tree and correct
- [x] BUG 2: Hide "New Assessment" button from Assessors/Reviewers/Executive Viewers in AssessmentList.tsx
- [x] Add organisations.myRole tRPC procedure to return current user's org role
- [x] Update AssessmentList.tsx to query user's org role and conditionally show Create button

## Bug Fixes — Session 3
- [x] FIX: Add cache invalidation to updateStatus.onSuccess in AssessmentWorkspace.tsx so UI re-renders after Start Assessment / Submit for Review
- [x] FIX: Add cache invalidation to submitScore.onSuccess in AssessmentWorkspace.tsx
- [x] FIX: Expand updateStatus allowed roles to include assessor (platform_owner already bypassed inside requireOrgAccess)

## Bug Fixes — Session 4
- [x] FIX: Add unique constraint (assessmentId, userId) to assessment_participants table
- [x] FIX: Create migration 0004_add_participant_unique.sql so Railway auto-applies on deploy
- [x] FIX: Update Drizzle journal to include all 5 migrations in correct order

## Bug Fixes — Session 5 (insertId + auto-seed)
- [x] FIX: Correct insertId extraction in templates.seed (templateId, domainId, capId)
- [x] FIX: Correct insertId extraction in organisations.create (orgId)
- [x] FIX: Correct insertId extraction in upsertScoreResponse (db.ts)
- [x] FIX: Add seedDefaultTemplateIfMissing() to db.ts (idempotent, uses raw SQL)
- [x] FIX: Wire seedDefaultTemplateIfMissing() into server startup after migrations
- [x] VERIFY: Sandbox DB has 8 domains, 25 capabilities, 125 level descriptors
