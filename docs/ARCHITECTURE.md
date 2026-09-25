# AI Mock Test — Cloudflare Architecture

## Product direction
Established, high-trust Indian examination platform. Use familiar competitive-exam interaction conventions, but keep all implementation, branding, copy and assets original.

## Runtime
Cloudflare-first. Verify the current Cloudflare-supported Next.js deployment path and runtime before locking the adapter. Prefer Web APIs and Cloudflare-compatible packages. Avoid unnecessary Node-only dependencies.

## Routes
Public:
- /
- /exams
- /exams/[exam]
- /exams/[exam]/prelims
- /exams/[exam]/mains
- /exams/[exam]/mock-test
- /exams/[exam]/[subject]

Authenticated:
- /dashboard
- /dashboard/history
- /dashboard/analytics
- /test/[attemptId]
- /test/[attemptId]/result
- /test/[attemptId]/analysis

Admin:
- /admin
- /admin/exams
- /admin/questions
- /admin/generation
- /admin/validation
- /admin/test-templates

Private areas must not be indexed.

## Database
profiles
exams
exam_stages
subjects
topics
questions
question_options
test_templates
test_attempts
test_attempt_questions
test_answers
results
performance_stats
user_preferences
admin_users

Use foreign keys, indexes, constraints, pagination and Supabase RLS.

## Question factory
AI batch generation -> schema validation -> answer validation -> duplicate detection -> human/admin review where configured -> approved pool.

Never call AI for every student attempt.

## Question validation
- exactly four options
- exactly one correct option
- duplicate option check
- answer verification
- explanation present
- exam/stage/subject/topic valid
- difficulty valid
- duplicate-question detection
- pattern validation
- language consistency

Only approved questions enter the production pool.

## Exam configuration
Data-driven fields:
- organization
- stage
- subjects
- topics
- question count
- marks
- negative marking
- duration
- section timing
- supported languages
- navigation rules
- pattern version
- active status

## Test language
Before test start, student selects:
- English
- Hindi
- Marathi

Language is part of question content. Equivalent language variants preserve logical identity, correct answer, scoring semantics and difficulty.

## Test engine
Instructions -> create attempt -> assign approved questions -> timer -> answer state -> save/next -> review -> guarded submit -> server-side scoring -> result -> analysis.

## Security
Browser submits answers only. Server retrieves authoritative answers and calculates score.

Never expose:
- future correct answers
- service-role key
- AI key
- admin-only data

## UX quality bar
Premium, restrained, credible, polished. Avoid generic AI-dashboard styling, noisy glassmorphism, excessive gradients and template filler content.

## Ads
AdSense-ready. No intrusive ads inside active examination.

## SEO
English-only public SEO routes. No language subdirectory system. Unique metadata, canonical URLs, breadcrumbs, internal links, structured data where appropriate, sitemap and robots controls.

## Delivery
Foundation -> database/auth -> exam config -> question pipeline -> test engine -> scoring/results -> dashboard -> admin -> SEO -> polish -> security -> performance -> Cloudflare deployment -> production verification.
