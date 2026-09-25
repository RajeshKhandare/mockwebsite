# Deployment checklist

## Supabase

1. Create a Supabase project.
2. Apply supabase/schema.sql.
3. Apply migrations in order: 0002_exam_and_user_foundation.sql, 0003_data_api_grants.sql, 0004_question_access.sql, 0005_profile_and_admin_hardening.sql, 0006_production_rls_hardening.sql.
4. Apply supabase/seed.sql for the original demo dataset. The seed expects the unique test-template slug constraint from migration 0006.
5. Configure Auth email/site settings for the production URL and /auth/callback.
6. Create an admin user through Supabase Auth, then add that user's UUID to public.admin_users.

## Cloudflare Workers

Cloudflare's current recommended path for full-stack Next.js on Workers is vinext.

Workers Builds:
- Repository: RajeshKhandare/mockwebsite
- Branch: main
- Build command: npm run build:vinext
- Deploy command: npx @vinext/cloudflare deploy --skip-build
- Root directory: repository root

Required runtime variables:
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Required server secret:
- SUPABASE_SECRET_KEY

The legacy NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY names remain supported as fallbacks for compatibility.

Do not expose SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, or future AI provider secrets to the browser.

## Production smoke test

After the first deployment:
1. Open /.
2. Open /exams and the published demo exam.
3. Open /tests.
4. Create a student account.
5. Start the demo test in English, Hindi and Marathi.
6. Verify answer save, mark for review, clear response and timer.
7. Submit and verify score, correct/incorrect/unattempted counts and answer explanations.
8. Verify dashboard history and analytics.
9. Verify unauthenticated access cannot open dashboard, active sessions or results.
10. Verify /robots.txt and /sitemap.xml use the production site URL.

## CI gate

Every push to main must pass:
- typecheck
- ESLint
- unit tests
- standard Next.js production build
- vinext production build
- vinext compatibility check
