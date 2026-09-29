-- 100-question mocks require an account; the existing 10-minute speed test stays free without sign-in.
update public.test_templates
set requires_login = true
where is_active = true
  and question_count >= 100
  and duration_seconds <> 600;

update public.test_templates
set requires_login = false
where slug = 'banking-speed-10m';