create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_stages (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  unique(exam_id, slug)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  slug text not null,
  unique(subject_id, slug)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_stage_id uuid references public.exam_stages(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  language text not null default 'en' check (language in ('en','hi','mr')),
  question_text text not null,
  explanation text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  status text not null default 'draft' check (status in ('draft','pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_index integer not null check (option_index between 0 and 3),
  option_text text not null,
  is_correct boolean not null default false,
  unique(question_id, option_index)
);

create table if not exists public.test_templates (
  id uuid primary key default gen_random_uuid(),
  exam_stage_id uuid references public.exam_stages(id) on delete set null,
  title text not null,
  test_type text not null check (test_type in ('full_mock','sectional','subject','topic','daily','practice','mixed','custom','weak_topic')),
  question_count integer not null check (question_count > 0),
  duration_seconds integer not null check (duration_seconds > 0),
  marks_per_question numeric(6,2) not null default 1,
  negative_marks numeric(6,2) not null default 0,
  supported_languages text[] not null default array['en','hi','mr'],
  is_active boolean not null default false
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_template_id uuid not null references public.test_templates(id),
  language text not null check (language in ('en','hi','mr')),
  status text not null default 'in_progress' check (status in ('in_progress','submitted','expired','abandoned')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.test_attempt_questions (
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  position integer not null,
  primary key (attempt_id, position)
);

create table if not exists public.test_answers (
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option integer,
  marked_for_review boolean not null default false,
  answered_at timestamptz,
  primary key (attempt_id, question_id)
);

create table if not exists public.results (
  attempt_id uuid primary key references public.test_attempts(id) on delete cascade,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  unattempted_count integer not null default 0,
  score numeric(10,2) not null default 0,
  accuracy numeric(6,2) not null default 0,
  time_taken_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_attempt_questions enable row level security;
alter table public.test_answers enable row level security;
alter table public.results enable row level security;

create policy "profiles own row" on public.profiles for select using (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);
create policy "attempts own rows" on public.test_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "attempt questions own attempts" on public.test_attempt_questions for all using (
  exists (select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);
create policy "answers own attempts" on public.test_answers for all using (
  exists (select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);
create policy "results own attempts" on public.results for select using (
  exists (select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);
