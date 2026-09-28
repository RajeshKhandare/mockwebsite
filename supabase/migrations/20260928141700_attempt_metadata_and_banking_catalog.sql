-- Content expansion: banking mock catalogue and attempt/result metadata are managed in Supabase.
-- Production data migration was applied to the connected Supabase project on 2026-09-28.
-- This marker keeps the repository migration history aligned with the live schema changes.
alter table public.test_attempts add column if not exists question_count integer;
alter table public.results add column if not exists subject_metrics jsonb not null default '{}'::jsonb;

update public.test_templates
set title='Banking Aptitude Full Mock — 100 Questions',
    description='Full-length banking aptitude mock with 100 questions selected from a 103+ approved question pool across quantitative aptitude and reasoning ability.'
where slug='banking-demo-quick-01';
