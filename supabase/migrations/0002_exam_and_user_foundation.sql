-- Upgrade an existing Supabase project after the original schema.
-- Safe to run repeatedly.

create table if not exists public.exam_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  exam_stage_id uuid references public.exam_stages(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  unique(exam_stage_id, slug)
);

alter table public.exams add column if not exists category_id uuid references public.exam_categories(id) on delete set null;
alter table public.exam_stages add column if not exists description text;
alter table public.questions add column if not exists section_id uuid references public.sections(id) on delete set null;
alter table public.questions add column if not exists source_type text not null default 'original';
alter table public.test_templates add column if not exists slug text;
alter table public.test_templates add column if not exists description text;

create table if not exists public.exam_stage_subjects (
  exam_stage_id uuid not null references public.exam_stages(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (exam_stage_id, subject_id)
);

create table if not exists public.test_template_sections (
  test_template_id uuid not null references public.test_templates(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  question_count integer not null check (question_count > 0),
  sort_order integer not null default 0,
  primary key (test_template_id, section_id)
);

create table if not exists public.performance_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempts_count integer not null default 0,
  completed_count integer not null default 0,
  average_accuracy numeric(6,2) not null default 0,
  average_score numeric(10,2) not null default 0,
  total_time_seconds bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en','hi','mr')),
  updated_at timestamptz not null default now()
);

alter table public.exam_categories enable row level security;
alter table public.exam_stage_subjects enable row level security;
alter table public.sections enable row level security;
alter table public.test_template_sections enable row level security;
alter table public.performance_stats enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "public active categories" on public.exam_categories;
create policy "public active categories" on public.exam_categories for select using (is_active = true);

drop policy if exists "public stage subjects" on public.exam_stage_subjects;
create policy "public stage subjects" on public.exam_stage_subjects for select using (
  exists (
    select 1 from public.exam_stages s
    join public.exams e on e.id = s.exam_id
    where s.id = exam_stage_id and e.is_active = true
  )
);

drop policy if exists "public sections" on public.sections;
create policy "public sections" on public.sections for select using (
  exists (
    select 1 from public.exam_stages s
    join public.exams e on e.id = s.exam_id
    where s.id = exam_stage_id and e.is_active = true
  )
);

drop policy if exists "public template sections" on public.test_template_sections;
create policy "public template sections" on public.test_template_sections for select using (
  exists (select 1 from public.test_templates t where t.id = test_template_id and t.is_active = true)
);

drop policy if exists "performance own row" on public.performance_stats;
create policy "performance own row" on public.performance_stats for select using (auth.uid() = user_id);

drop policy if exists "preferences own row" on public.user_preferences;
create policy "preferences own row" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
