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


## Scalable question operations

The production question lifecycle is:
1. Provider/manual batch enters question_batches.
2. Server validates the candidate schema and exactly four unique options.
3. A deterministic database validator verifies exactly one answer key, required metadata, explanation presence and near-duplicate similarity.
4. Questions that pass the deterministic gate are automatically moved into the approved pool; exceptions move to needs_review or rejected.
5. Every validation and human decision is recorded in question_validation_runs and question_reviews.
6. question_quality_metrics stores quality/confidence signals and post-publication performance.
7. Student reports create question_reports; reported or anomalous questions can be removed from the live pool and reviewed.
8. The AI semantic-review adapter remains provider-agnostic so a paid/external provider can be enabled later without changing the student test engine.

Automatic approval is intentionally limited to deterministic checks. A future semantic AI reviewer can add an additional gate rather than allowing an LLM to publish unverified answer keys.

## Test assembly

test_templates.selection_rules and test_blueprints.rules control section, subject, topic and difficulty distribution. The test engine selects only approved questions and refuses to start a test when the approved pool cannot satisfy the configured blueprint.

## Long-term product readiness

The data model is ready for:
- personalized weak-topic practice
- question quality monitoring and student reports
- premium test series/subscriptions
- AI analysis/usage credits
- affiliate placements outside active tests
- institute/B2B workspaces
- future question-generation API

These capabilities are kept server-side/data-driven and are not exposed in the public UX until product demand and operational readiness justify activation.
