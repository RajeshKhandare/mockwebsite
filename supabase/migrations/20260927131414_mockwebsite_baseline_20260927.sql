-- Mockwebsite production baseline: exam catalog, test engine, question factory, QC, analytics and RLS.
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text, avatar_url text, target_exam text, education_level text, state text,
 preparation_stage text, preferred_language text not null default 'en' check(preferred_language in ('en','hi','mr')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.exam_categories (
 id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null,
 description text, sort_order integer not null default 0, is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.exams (
 id uuid primary key default gen_random_uuid(), category_id uuid references public.exam_categories(id) on delete set null,
 slug text unique not null, name text not null, organization text, description text,
 is_active boolean not null default false, pattern_version text, pattern_source_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.exam_stages (
 id uuid primary key default gen_random_uuid(), exam_id uuid not null references public.exams(id) on delete cascade,
 slug text not null, name text not null, description text, duration_seconds integer not null default 3600,
 total_questions integer not null default 0, total_marks numeric(10,2) not null default 0,
 negative_marking numeric(6,2) not null default 0, navigation_rules jsonb not null default '{}'::jsonb,
 sort_order integer not null default 0, is_active boolean not null default false, unique(exam_id,slug)
);
create table if not exists public.subjects (
 id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, is_active boolean not null default true
);
create table if not exists public.exam_stage_subjects (
 exam_stage_id uuid not null references public.exam_stages(id) on delete cascade,
 subject_id uuid not null references public.subjects(id) on delete cascade, sort_order integer not null default 0,
 primary key(exam_stage_id,subject_id)
);
create table if not exists public.sections (
 id uuid primary key default gen_random_uuid(), exam_stage_id uuid not null references public.exam_stages(id) on delete cascade,
 subject_id uuid references public.subjects(id) on delete set null, slug text not null, name text not null,
 sort_order integer not null default 0, unique(exam_stage_id,slug)
);
create table if not exists public.topics (
 id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.subjects(id) on delete cascade,
 slug text not null, name text not null, sort_order integer not null default 0, is_active boolean not null default true,
 unique(subject_id,slug)
);

create table if not exists public.question_batches (
 id uuid primary key default gen_random_uuid(), exam_stage_id uuid references public.exam_stages(id) on delete set null,
 subject_id uuid references public.subjects(id) on delete set null, topic_id uuid references public.topics(id) on delete set null,
 requested_count integer not null default 0, generated_count integer not null default 0, validated_count integer not null default 0,
 approved_count integer not null default 0, rejected_count integer not null default 0,
 source_type text not null default 'ai' check(source_type in ('ai','original','import','pyq_inspired','manual')),
 provider text, model text, language text not null default 'en' check(language in ('en','hi','mr')),
 difficulty_mix jsonb not null default '{}'::jsonb,
 status text not null default 'draft' check(status in ('draft','generating','validating','review','completed','failed','cancelled')),
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.questions (
 id uuid primary key default gen_random_uuid(), exam_stage_id uuid references public.exam_stages(id) on delete set null,
 subject_id uuid references public.subjects(id) on delete set null, topic_id uuid references public.topics(id) on delete set null,
 section_id uuid references public.sections(id) on delete set null, question_group_id uuid,
 language text not null default 'en' check(language in ('en','hi','mr')), question_text text not null,
 normalized_text text not null, question_hash text not null, explanation text,
 difficulty text not null default 'medium' check(difficulty in ('easy','medium','hard')),
 status text not null default 'draft' check(status in ('draft','pending','approved','rejected','needs_review','archived')),
 source_type text not null default 'original' check(source_type in ('original','ai','import','pyq_inspired','manual')),
 source_batch_id uuid references public.question_batches(id) on delete set null,
 quality_score numeric(5,2), quality_confidence numeric(5,2),
 validation_status text not null default 'unvalidated' check(validation_status in ('unvalidated','validating','passed','failed','needs_review')),
 auto_decision text check(auto_decision in ('approved','review','rejected')), review_required boolean not null default true,
 approved_at timestamptz, approved_by uuid references auth.users(id) on delete set null, retired_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(question_hash,language)
);
create table if not exists public.question_options (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
 option_index integer not null check(option_index between 0 and 3), option_text text not null, is_correct boolean not null default false,
 unique(question_id,option_index)
);
create table if not exists public.question_versions (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
 version_number integer not null, question_text text not null, explanation text, difficulty text not null,
 changed_by uuid references auth.users(id) on delete set null, change_reason text, snapshot jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), unique(question_id,version_number)
);
create table if not exists public.question_validation_runs (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
 batch_id uuid references public.question_batches(id) on delete set null,
 validator_type text not null, status text not null, score numeric(5,2),
 checks jsonb not null default '{}'::jsonb, errors jsonb not null default '[]'::jsonb, warnings jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists public.question_reviews (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
 reviewer_id uuid references auth.users(id) on delete set null, action text not null, from_status text, to_status text not null,
 notes text, created_at timestamptz not null default now()
);
create table if not exists public.question_quality_metrics (
 question_id uuid primary key references public.questions(id) on delete cascade,
 structural_score numeric(5,2) not null default 0, answer_key_score numeric(5,2) not null default 0,
 explanation_score numeric(5,2) not null default 0, metadata_score numeric(5,2) not null default 0,
 duplicate_score numeric(5,2) not null default 0, relevance_score numeric(5,2) not null default 0,
 ambiguity_score numeric(5,2) not null default 0, overall_score numeric(5,2) not null default 0,
 confidence numeric(5,2) not null default 0, attempts_count integer not null default 0, correct_count integer not null default 0,
 incorrect_count integer not null default 0, report_count integer not null default 0, average_time_seconds numeric(10,2),
 anomaly_flag boolean not null default false, updated_at timestamptz not null default now()
);

create table if not exists public.test_blueprints (
 id uuid primary key default gen_random_uuid(), exam_stage_id uuid not null references public.exam_stages(id) on delete cascade,
 name text not null, version text not null, rules jsonb not null default '{}'::jsonb, is_active boolean not null default false,
 created_at timestamptz not null default now(), unique(exam_stage_id,version)
);
create table if not exists public.test_templates (
 id uuid primary key default gen_random_uuid(), exam_stage_id uuid references public.exam_stages(id) on delete set null,
 blueprint_id uuid references public.test_blueprints(id) on delete set null, slug text unique not null, title text not null, description text,
 test_type text not null check(test_type in ('full_mock','sectional','subject','topic','daily','practice','mixed','custom','weak_topic')),
 question_count integer not null check(question_count > 0), duration_seconds integer not null check(duration_seconds > 0),
 marks_per_question numeric(6,2) not null default 1, negative_marks numeric(6,2) not null default 0,
 supported_languages text[] not null default array['en','hi','mr'], selection_rules jsonb not null default '{}'::jsonb,
 requires_login boolean not null default true, is_active boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.test_template_sections (
 test_template_id uuid not null references public.test_templates(id) on delete cascade,
 section_id uuid not null references public.sections(id) on delete cascade, question_count integer not null, sort_order integer not null default 0,
 primary key(test_template_id,section_id)
);

create table if not exists public.test_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, guest_token text,
 test_template_id uuid not null references public.test_templates(id), language text not null check(language in ('en','hi','mr')),
 status text not null default 'in_progress' check(status in ('in_progress','submitted','expired','abandoned')),
 started_at timestamptz not null default now(), submitted_at timestamptz, duration_seconds integer,
 score numeric(10,2), accuracy numeric(6,2), attempted_count integer not null default 0, correct_count integer not null default 0,
 incorrect_count integer not null default 0, unattempted_count integer not null default 0, check(user_id is not null or guest_token is not null)
);
create table if not exists public.test_attempt_questions (
 attempt_id uuid not null references public.test_attempts(id) on delete cascade, question_id uuid not null references public.questions(id),
 position integer not null, marked_for_review boolean not null default false, visited_at timestamptz,
 primary key(attempt_id,position), unique(attempt_id,question_id)
);
create table if not exists public.test_answers (
 attempt_id uuid not null references public.test_attempts(id) on delete cascade, question_id uuid not null references public.questions(id),
 selected_option integer check(selected_option between 0 and 3), marked_for_review boolean not null default false,
 answered_at timestamptz, changed_at timestamptz, primary key(attempt_id,question_id)
);
create table if not exists public.test_attempt_events (
 id bigint generated always as identity primary key, attempt_id uuid not null references public.test_attempts(id) on delete cascade,
 question_id uuid references public.questions(id) on delete set null, event_type text not null, selected_option integer,
 elapsed_seconds integer, created_at timestamptz not null default now()
);
create table if not exists public.question_reports (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
 attempt_id uuid references public.test_attempts(id) on delete set null, user_id uuid references auth.users(id) on delete set null, guest_token text,
 reason text not null, details text, status text not null default 'open', resolution text,
 resolved_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), resolved_at timestamptz
);
create table if not exists public.results (
 attempt_id uuid primary key references public.test_attempts(id) on delete cascade, correct_count integer not null default 0,
 incorrect_count integer not null default 0, unattempted_count integer not null default 0, score numeric(10,2) not null default 0,
 accuracy numeric(6,2) not null default 0, time_taken_seconds integer not null default 0,
 section_metrics jsonb not null default '{}'::jsonb, topic_metrics jsonb not null default '{}'::jsonb,
 score_breakdown jsonb not null default '{}'::jsonb, generated_at timestamptz not null default now()
);
create table if not exists public.performance_stats (
 user_id uuid primary key references auth.users(id) on delete cascade, attempts_count integer not null default 0,
 completed_count integer not null default 0, average_accuracy numeric(6,2) not null default 0,
 average_score numeric(10,2) not null default 0, total_time_seconds bigint not null default 0,
 trend_data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists public.performance_topic_stats (
 user_id uuid not null references auth.users(id) on delete cascade, topic_id uuid not null references public.topics(id) on delete cascade,
 attempts_count integer not null default 0, questions_attempted integer not null default 0, correct_count integer not null default 0,
 incorrect_count integer not null default 0, unattempted_count integer not null default 0, average_accuracy numeric(6,2) not null default 0,
 average_time_seconds numeric(10,2), updated_at timestamptz not null default now(), primary key(user_id,topic_id)
);
create table if not exists public.user_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade, preferred_language text not null default 'en',
 theme text default 'system', notification_preferences jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(),
 check(preferred_language in ('en','hi','mr'))
);
create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade, role text not null default 'admin',
 active boolean not null default true, created_at timestamptz not null default now(),
 check(role in ('admin','reviewer','content_manager'))
);

create index if not exists questions_stage_status_idx on public.questions(exam_stage_id,status);
create index if not exists questions_subject_topic_status_idx on public.questions(subject_id,topic_id,status);
create index if not exists questions_language_status_idx on public.questions(language,status);
create index if not exists questions_hash_idx on public.questions(question_hash);
create index if not exists questions_text_trgm_idx on public.questions using gin(normalized_text gin_trgm_ops);
create index if not exists question_batches_status_idx on public.question_batches(status,created_at desc);
create index if not exists validation_question_idx on public.question_validation_runs(question_id,created_at desc);
create index if not exists reviews_question_idx on public.question_reviews(question_id,created_at desc);
create index if not exists reports_status_idx on public.question_reports(status,created_at desc);
create index if not exists attempts_user_idx on public.test_attempts(user_id,started_at desc);
create index if not exists attempts_guest_idx on public.test_attempts(guest_token) where guest_token is not null;
create index if not exists attempt_events_attempt_idx on public.test_attempt_events(attempt_id,created_at);
create index if not exists attempt_questions_question_idx on public.test_attempt_questions(question_id);

alter table public.profiles enable row level security;
alter table public.exam_categories enable row level security; alter table public.exams enable row level security;
alter table public.exam_stages enable row level security; alter table public.subjects enable row level security;
alter table public.exam_stage_subjects enable row level security; alter table public.sections enable row level security;
alter table public.topics enable row level security; alter table public.question_batches enable row level security;
alter table public.questions enable row level security; alter table public.question_options enable row level security;
alter table public.question_versions enable row level security; alter table public.question_validation_runs enable row level security;
alter table public.question_reviews enable row level security; alter table public.question_quality_metrics enable row level security;
alter table public.question_reports enable row level security; alter table public.test_blueprints enable row level security;
alter table public.test_templates enable row level security; alter table public.test_template_sections enable row level security;
alter table public.test_attempts enable row level security; alter table public.test_attempt_questions enable row level security;
alter table public.test_answers enable row level security; alter table public.test_attempt_events enable row level security;
alter table public.results enable row level security; alter table public.performance_stats enable row level security;
alter table public.performance_topic_stats enable row level security; alter table public.user_preferences enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,nullif(trim(coalesce(new.raw_user_meta_data->>'display_name','')),'')) on conflict(id) do nothing;
 insert into public.performance_stats(user_id) values(new.id) on conflict(user_id) do nothing;
 insert into public.user_preferences(user_id) values(new.id) on conflict(user_id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.question_normalize(input text) returns text language sql immutable as $$
select regexp_replace(lower(trim(coalesce(input,''))),'\s+',' ','g'); $$;
create or replace function public.admin_is_member() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.admin_users where user_id=(select auth.uid()) and active=true); $$;

create or replace function public.validate_question(question_id_input uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q record; option_count integer; correct_count integer; duplicate_similarity real:=0; passed boolean; result jsonb;
begin
 select id,question_text,normalized_text,explanation,exam_stage_id,subject_id,topic_id,language,difficulty into q
 from public.questions where id=question_id_input;
 if not found then return jsonb_build_object('ok',false,'reason','question_not_found'); end if;
 select count(*),count(*) filter(where is_correct) into option_count,correct_count from public.question_options where question_id=question_id_input;
 select coalesce(max(similarity(q.normalized_text,other.normalized_text)),0) into duplicate_similarity
 from public.questions other where other.id<>question_id_input and other.language=q.language
 and other.exam_stage_id is not distinct from q.exam_stage_id and other.status not in('rejected','archived');
 passed:=option_count=4 and correct_count=1 and coalesce(length(trim(q.explanation)),0)>0
   and q.exam_stage_id is not null and q.subject_id is not null and q.topic_id is not null and duplicate_similarity<0.88;
 result:=jsonb_build_object('schema_valid',q.question_text<>'','four_options',option_count=4,'one_correct',correct_count=1,
   'explanation_present',coalesce(length(trim(q.explanation)),0)>0,'metadata_valid',q.exam_stage_id is not null and q.subject_id is not null and q.topic_id is not null,
   'duplicate_similarity',round(duplicate_similarity::numeric,4),'passed',passed);
 update public.questions set normalized_text=public.question_normalize(q.question_text),
   validation_status=case when passed then 'passed' when option_count=4 and correct_count=1 and duplicate_similarity<0.93 then 'needs_review' else 'failed' end,
   review_required=not passed, auto_decision=case when passed then 'approved' when option_count=4 and correct_count=1 and duplicate_similarity<0.93 then 'review' else 'rejected' end,
   updated_at=now() where id=question_id_input;
 insert into public.question_validation_runs(question_id,validator_type,status,score,checks,warnings)
 values(question_id_input,'deterministic',case when passed then 'passed' else 'warning' end,case when option_count=4 and correct_count=1 then 100 else 50 end,result,
 case when duplicate_similarity>=0.88 then jsonb_build_array('Possible duplicate or near-duplicate question') else '[]'::jsonb end);
 insert into public.question_quality_metrics(question_id,structural_score,answer_key_score,explanation_score,metadata_score,duplicate_score,overall_score,confidence)
 values(question_id_input,case when option_count=4 then 100 else 0 end,case when correct_count=1 then 100 else 0 end,
 case when coalesce(length(trim(q.explanation)),0)>0 then 100 else 0 end,
 case when q.exam_stage_id is not null and q.subject_id is not null and q.topic_id is not null then 100 else 0 end,
 case when duplicate_similarity<0.88 then 100 else greatest(0,100-(duplicate_similarity*100)) end,
 case when passed then 90 else 50 end,case when passed then 90 else 50 end)
 on conflict(question_id) do update set structural_score=excluded.structural_score,answer_key_score=excluded.answer_key_score,
 explanation_score=excluded.explanation_score,metadata_score=excluded.metadata_score,duplicate_score=excluded.duplicate_score,
 overall_score=excluded.overall_score,confidence=excluded.confidence,updated_at=now();
 return result;
end; $$;

revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.validate_question(uuid) from public,anon,authenticated;
revoke execute on function public.admin_is_member() from public,anon;
grant execute on function public.admin_is_member() to authenticated;

create policy "public active categories" on public.exam_categories for select to anon,authenticated using(is_active);
create policy "public active exams" on public.exams for select to anon,authenticated using(is_active);
create policy "public active stages" on public.exam_stages for select to anon,authenticated using(exists(select 1 from public.exams e where e.id=exam_id and e.is_active));
create policy "public active subjects" on public.subjects for select to anon,authenticated using(exists(select 1 from public.exam_stage_subjects ess join public.exam_stages s on s.id=ess.exam_stage_id join public.exams e on e.id=s.exam_id where ess.subject_id=subjects.id and e.is_active and s.is_active));
create policy "public active stage subjects" on public.exam_stage_subjects for select to anon,authenticated using(exists(select 1 from public.exam_stages s join public.exams e on e.id=s.exam_id where s.id=exam_stage_id and e.is_active and s.is_active));
create policy "public active sections" on public.sections for select to anon,authenticated using(exists(select 1 from public.exam_stages s join public.exams e on e.id=s.exam_id where s.id=exam_stage_id and e.is_active and s.is_active));
create policy "public active topics" on public.topics for select to anon,authenticated using(exists(select 1 from public.exam_stage_subjects ess join public.exam_stages s on s.id=ess.exam_stage_id join public.exams e on e.id=s.exam_id where ess.subject_id=topics.subject_id and e.is_active and s.is_active and topics.is_active));
create policy "public active blueprints" on public.test_blueprints for select to anon,authenticated using(is_active);
create policy "public active templates" on public.test_templates for select to anon,authenticated using(is_active and (exam_stage_id is null or exists(select 1 from public.exam_stages s join public.exams e on e.id=s.exam_id where s.id=exam_stage_id and e.is_active and s.is_active)));
create policy "public active template sections" on public.test_template_sections for select to anon,authenticated using(exists(select 1 from public.test_templates t where t.id=test_template_id and t.is_active));

create policy "own profile select" on public.profiles for select to authenticated using((select auth.uid())=id);
create policy "own profile update" on public.profiles for update to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);
create policy "own preferences" on public.user_preferences for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "own attempts" on public.test_attempts for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "own attempt questions" on public.test_attempt_questions for select to authenticated using(exists(select 1 from public.test_attempts a where a.id=attempt_id and a.user_id=(select auth.uid())));
create policy "own answers" on public.test_answers for all to authenticated using(exists(select 1 from public.test_attempts a where a.id=attempt_id and a.user_id=(select auth.uid()))) with check(exists(select 1 from public.test_attempts a where a.id=attempt_id and a.user_id=(select auth.uid())));
create policy "own attempt events" on public.test_attempt_events for insert to authenticated with check(exists(select 1 from public.test_attempts a where a.id=attempt_id and a.user_id=(select auth.uid())));
create policy "own results" on public.results for select to authenticated using(exists(select 1 from public.test_attempts a where a.id=attempt_id and a.user_id=(select auth.uid())));
create policy "own performance" on public.performance_stats for select to authenticated using((select auth.uid())=user_id);
create policy "own topic performance" on public.performance_topic_stats for select to authenticated using((select auth.uid())=user_id);
create policy "attempt linked questions" on public.questions for select to authenticated using(exists(select 1 from public.test_attempt_questions aq join public.test_attempts a on a.id=aq.attempt_id where aq.question_id=questions.id and a.user_id=(select auth.uid())));
create policy "attempt linked options" on public.question_options for select to authenticated using(exists(select 1 from public.test_attempt_questions aq join public.test_attempts a on a.id=aq.attempt_id where aq.question_id=question_options.question_id and a.user_id=(select auth.uid())));
create policy "own question reports insert" on public.question_reports for insert to authenticated with check((select auth.uid())=user_id);
create policy "own question reports select" on public.question_reports for select to authenticated using((select auth.uid())=user_id);
create policy "admin read questions" on public.questions for select to authenticated using((select public.admin_is_member()));
create policy "admin read options" on public.question_options for select to authenticated using((select public.admin_is_member()));
create policy "admin read batches" on public.question_batches for select to authenticated using((select public.admin_is_member()));
create policy "admin read validations" on public.question_validation_runs for select to authenticated using((select public.admin_is_member()));
create policy "admin read reviews" on public.question_reviews for select to authenticated using((select public.admin_is_member()));
create policy "admin read metrics" on public.question_quality_metrics for select to authenticated using((select public.admin_is_member()));
create policy "admin read reports" on public.question_reports for select to authenticated using((select public.admin_is_member()));
create policy "admin read versions" on public.question_versions for select to authenticated using((select public.admin_is_member()));
create policy "admin read blueprints" on public.test_blueprints for select to authenticated using((select public.admin_is_member()));
create policy "admin read templates" on public.test_templates for select to authenticated using((select public.admin_is_member()));
create policy "admin read admin users" on public.admin_users for select to authenticated using((select auth.uid())=user_id or (select public.admin_is_member()));

grant select on public.exam_categories,public.exams,public.exam_stages,public.subjects,public.exam_stage_subjects,public.sections,public.topics,public.test_blueprints,public.test_templates,public.test_template_sections to anon,authenticated;
grant select on public.questions,public.question_options to authenticated;
grant insert on public.question_reports to authenticated;
grant select,update on public.profiles to authenticated;
grant select,insert,update on public.test_attempts,public.test_answers to authenticated;
grant select,insert on public.test_attempt_events to authenticated;
grant select on public.test_attempt_questions,public.results,public.performance_stats,public.performance_topic_stats,public.user_preferences,public.admin_users to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon,authenticated;