# AI Mock Test — Cloudflare Edition

Premium, mobile-first competitive-exam mock-test platform for Indian exam preparation.

## Locked scope
- Cloudflare-first deployment
- Next.js + TypeScript
- Supabase PostgreSQL + Auth + RLS
- Server-side scoring
- Batch question factory with deterministic validation, near-duplicate detection, review queue and automatic approval for passing candidates
- Test language selection: English, Hindi, Marathi
- Premium exam-platform UX
- English-only public SEO URL structure
- No locale route tree
- Separate from MockTestVercel

## Delivery rule
BUILD -> TEST -> VERIFY -> FIX -> DEPLOY

## Current implementation
- Generic exam, stage, subject, topic and test-template foundation
- Supabase schema, migrations and original demo seed data
- Cookie-based Supabase Auth foundation
- Authenticated attempt creation, answer persistence and server-side result scoring
- Student dashboard, history, topic-level performance analytics and weak-topic recommendations
- Blueprint-aware test assembly using approved questions only
- Student question reporting and post-publication quality monitoring
- Timestamped Supabase migrations with RLS/security hardening
- CI validates typecheck, lint, unit tests and production build

See docs/ARCHITECTURE.md, docs/PRODUCT-UX.md and docs/TESTING-CHECKLIST.md.



## Launch verification

The production catalog and authenticated test flow are validated through CI before release.


## Question quality promise

Questions are not published directly from an AI generator. Every imported/generated candidate passes schema checks, four-option/one-answer validation, metadata checks and near-duplicate detection. Passing candidates can enter the approved pool automatically; semantic or ambiguous cases remain in the review queue. All review decisions are auditable.

## Product expansion architecture

The platform is intentionally data-driven so future capabilities can be activated without rebuilding the student engine: personalized weak-topic practice, AI analysis/usage credits, premium test series, affiliate placements outside active tests, institute/B2B workspaces and a future question-generation API.

The public UX only exposes capabilities that are production-ready. Server-side tables and workflows for future capabilities remain isolated until they are intentionally activated.
