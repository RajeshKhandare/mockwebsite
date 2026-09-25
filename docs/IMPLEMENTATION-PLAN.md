# Implementation Plan

## Phase 1 — Foundation
1. Verify Cloudflare runtime and current Next.js adapter.
2. Establish TypeScript project structure.
3. Add lint/typecheck/test/build scripts.
4. Add error boundaries, not-found and loading states.
5. Add CI checks.

## Phase 2 — Supabase
1. SQL migrations.
2. Auth integration.
3. Profiles and roles.
4. RLS policies.
5. Server-only privileged client.
6. Seed exam configuration.

## Phase 3 — Exam configuration
1. Exam/stage/subject/topic CRUD.
2. Test-template model.
3. Supported language configuration.
4. Pattern versioning.

## Phase 4 — Questions
1. Question schema.
2. Options schema.
3. AI batch-generation endpoint.
4. Validation pipeline.
5. Duplicate detection.
6. Approval lifecycle.
7. Pool health metrics.

## Phase 5 — Test engine
1. Instructions.
2. Language selection.
3. Attempt creation.
4. Question assignment.
5. Timer.
6. Answer state.
7. Question palette.
8. Mark/review.
9. Auto-save.
10. Submit guard.

## Phase 6 — Scoring
1. Server-side scoring.
2. Negative marking.
3. Section and topic aggregation.
4. Result persistence.
5. Answer review and explanations.

## Phase 7 — Student area
1. Dashboard.
2. History.
3. Analytics.
4. Weak-topic views.
5. Preferences.

## Phase 8 — Admin
1. Admin authentication/authorization.
2. Exam management.
3. Question generation.
4. Validation/review queue.
5. Test templates.
6. Pool monitoring.

## Phase 9 — SEO/content
1. Exam landing pages.
2. Pattern pages.
3. Mock-test pages.
4. Metadata/canonical.
5. Breadcrumbs.
6. JSON-LD.
7. Sitemap/robots.
8. Internal linking.

## Phase 10 — Premium polish
1. Visual hierarchy.
2. Responsive behavior.
3. Micro-interactions.
4. Loading/empty/error states.
5. Accessibility.
6. Performance.

## Phase 11 — Hardening
1. Rate limiting.
2. Input validation.
3. Authz checks.
4. Secret review.
5. Cache review.
6. Security headers.
7. Abuse protection.

## Phase 12 — Delivery
BUILD -> TEST -> VERIFY -> FIX -> DEPLOY.
Production verification is required before calling the project launch-ready.
