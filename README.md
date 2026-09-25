# AI Mock Test — Cloudflare Edition

Premium, mobile-first competitive-exam mock-test platform for Indian exam preparation.

## Locked scope
- Cloudflare-first deployment
- Next.js + TypeScript
- Supabase PostgreSQL + Auth + RLS
- Server-side scoring
- Batch AI question generation with validation
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
- Student dashboard and test history foundation
- CI validates typecheck, lint, unit tests and production build

See docs/ARCHITECTURE.md, docs/PRODUCT-UX.md and docs/TESTING-CHECKLIST.md.



## Launch verification

The production catalog and authenticated test flow are validated through CI before release.
