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

## Future Phases (Not Built Yet)
- [ ] Phase 2: Facilitator sign-off workflow with email notifications
- [ ] Phase 2: Assessment invitation links for external assessors
- [ ] Phase 3: File upload evidence (S3) — deferred by design decision
- [ ] Phase 3: Custom assessment templates (admin template builder)
- [ ] Phase 3: Benchmark comparisons across organisations
