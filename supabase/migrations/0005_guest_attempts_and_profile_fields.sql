-- Guest test access and optional student profile enrichment.
alter table public.test_templates
  add column if not exists requires_login boolean not null default true;

update public.test_templates
set requires_login = false
where slug = 'banking-demo-quick-01';

alter table public.test_attempts
  alter column user_id drop not null;

alter table public.test_attempts
  add column if not exists guest_token text;

create unique index if not exists test_attempts_guest_token_uidx
  on public.test_attempts (guest_token)
  where guest_token is not null;

alter table public.test_attempts
  drop constraint if exists test_attempts_owner_check;

alter table public.test_attempts
  add constraint test_attempts_owner_check
  check (user_id is not null or guest_token is not null);

alter table public.profiles
  add column if not exists target_exam text,
  add column if not exists education_level text,
  add column if not exists state text,
  add column if not exists preparation_stage text,
  add column if not exists preferred_language text;
