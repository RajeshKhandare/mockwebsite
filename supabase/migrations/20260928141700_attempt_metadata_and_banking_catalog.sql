-- Content expansion: banking mock catalogue and attempt/result metadata are managed in Supabase.
-- Production data migration was applied to the connected Supabase project on 2026-09-28.
-- This marker keeps the repository migration history aligned with the live schema changes.
alter table public.test_attempts add column if not exists question_count integer;
alter table public.results add column if not exists subject_metrics jsonb not null default '{}'::jsonb;

update public.test_templates
set title='Banking Aptitude Full Mock — 100 Questions',
    description='Full-length banking aptitude mock with 100 questions selected from a 103+ approved question pool across quantitative aptitude and reasoning ability.'
where slug='banking-demo-quick-01';

update public.test_templates
set question_count=50,
    description='A 10-minute speed practice pool with 50+ approved questions. Choose 5, 10, 15 or 20 questions for each session.'
where slug='banking-speed-10m';
