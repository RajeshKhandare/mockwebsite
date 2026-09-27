-- Security and performance hardening for the question factory and exam engine.
create schema if not exists private;
alter extension pg_trgm set schema extensions;
drop index if exists public.questions_text_trgm_idx;
create index if not exists questions_text_trgm_idx on public.questions using gin(normalized_text extensions.gin_trgm_ops);

drop policy if exists "admin read questions" on public.questions;
drop policy if exists "admin read options" on public.question_options;
drop policy if exists "admin read batches" on public.question_batches;
drop policy if exists "admin read validations" on public.question_validation_runs;
drop policy if exists "admin read reviews" on public.question_reviews;
drop policy if exists "admin read metrics" on public.question_quality_metrics;
drop policy if exists "admin read reports" on public.question_reports;
drop policy if exists "admin read versions" on public.question_versions;
drop policy if exists "admin read blueprints" on public.test_blueprints;
drop policy if exists "admin read templates" on public.test_templates;
drop policy if exists "admin read admin users" on public.admin_users;
drop function if exists public.admin_is_member();

create or replace function public.question_normalize(input text) returns text language sql immutable set search_path='' as $$ select regexp_replace(lower(trim(coalesce(input,''))), '\s+', ' ', 'g'); $$;
create or replace function public.validate_question(question_id_input uuid) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare q record; option_count integer; correct_count integer; duplicate_similarity real:=0; passed boolean; result jsonb;
begin
 select id,question_text,normalized_text,explanation,exam_stage_id,subject_id,topic_id,language,difficulty into q from public.questions where id=question_id_input;
 if not found then return jsonb_build_object('ok',false,'reason','question_not_found'); end if;
 select count(*),count(*) filter(where is_correct) into option_count,correct_count from public.question_options where question_id=question_id_input;
 select coalesce(max(extensions.similarity(q.normalized_text,other.normalized_text)),0) into duplicate_similarity from public.questions other where other.id<>question_id_input and other.language=q.language and other.exam_stage_id is not distinct from q.exam_stage_id and other.status not in('rejected','archived');
 passed:=option_count=4 and correct_count=1 and coalesce(length(trim(q.explanation)),0)>0 and q.exam_stage_id is not null and q.subject_id is not null and q.topic_id is not null and duplicate_similarity<0.88;
 result:=jsonb_build_object('ok',true,'schema_valid',q.question_text<>'','four_options',option_count=4,'one_correct',correct_count=1,'explanation_present',coalesce(length(trim(q.explanation)),0)>0,'metadata_valid',q.exam_stage_id is not null and q.subject_id is not null and q.topic_id is not null,'duplicate_similarity',round(duplicate_similarity::numeric,4),'passed',passed);
 update public.questions set normalized_text=public.question_normalize(q.question_text),validation_status=case when passed then 'passed' when option_count=4 and correct_count=1 and duplicate_similarity<0.93 then 'needs_review' else 'failed' end,review_required=not passed,auto_decision=case when passed then 'approved' when option_count=4 and correct_count=1 and duplicate_similarity<0.93 then 'review' else 'rejected' end,status=case when passed then 'approved' when option_count=4 and correct_count=1 and duplicate_similarity<0.93 then 'needs_review' else 'rejected' end,approved_at=case when passed then coalesce(approved_at,now()) else approved_at end,updated_at=now() where id=question_id_input;
 insert into public.question_validation_runs(question_id,validator_type,status,score,checks,warnings) values(question_id_input,'deterministic',case when passed then 'passed' else 'warning' end,case when option_count=4 and correct_count=1 then 100 else 50 end,result,case when duplicate_similarity>=0.88 then jsonb_build_array('Possible duplicate or near-duplicate question') else '[]'::jsonb end);
 insert into public.question_quality_metrics(question_id,structural_score,answer_key_score,explanation_score,metadata_score,duplicate_score,overall_score,confidence) values(question_id_input,case when option_count=4 then 100 else 0 end,case when correct_count=1 then 100 else 0 end,case when coalesce(length(trim(q.explanation)),0)>0 then 100 else 0 end,case when q.exam_stage_id is not null and q.subject_id is not null and q.topic_id is not null then 100 else 0 end,case when duplicate_similarity<0.88 then 100 else greatest(0,100-(duplicate_similarity*100)) end,case when passed then 90 else 50 end,case when passed then 90 else 50 end) on conflict(question_id) do update set structural_score=excluded.structural_score,answer_key_score=excluded.answer_key_score,explanation_score=excluded.explanation_score,metadata_score=excluded.metadata_score,duplicate_score=excluded.duplicate_score,overall_score=excluded.overall_score,confidence=excluded.confidence,updated_at=now();
 return result;
end; $$;
revoke execute on function public.validate_question(uuid) from public,anon,authenticated;

create index if not exists exam_stage_subjects_subject_idx on public.exam_stage_subjects(subject_id);
create index if not exists exams_category_idx on public.exams(category_id);
create index if not exists performance_topic_stats_topic_idx on public.performance_topic_stats(topic_id);
create index if not exists question_batches_created_by_idx on public.question_batches(created_by);
create index if not exists question_batches_stage_idx on public.question_batches(exam_stage_id);
create index if not exists question_batches_subject_idx on public.question_batches(subject_id);
create index if not exists question_batches_topic_idx on public.question_batches(topic_id);
create index if not exists question_reports_attempt_idx on public.question_reports(attempt_id);
create index if not exists question_reports_question_idx on public.question_reports(question_id);
create index if not exists question_reports_resolved_by_idx on public.question_reports(resolved_by);
create index if not exists question_reports_user_idx on public.question_reports(user_id);
create index if not exists question_reviews_reviewer_idx on public.question_reviews(reviewer_id);
create index if not exists question_validation_batch_idx on public.question_validation_runs(batch_id);
create index if not exists question_versions_changed_by_idx on public.question_versions(changed_by);
create index if not exists questions_approved_by_idx on public.questions(approved_by);
create index if not exists questions_section_idx on public.questions(section_id);
create index if not exists questions_source_batch_idx on public.questions(source_batch_id);
create index if not exists questions_topic_idx on public.questions(topic_id);
create index if not exists sections_subject_idx on public.sections(subject_id);
create index if not exists test_answers_question_idx on public.test_answers(question_id);
create index if not exists test_attempt_events_question_idx on public.test_attempt_events(question_id);
create index if not exists test_attempts_template_idx on public.test_attempts(test_template_id);
create index if not exists test_template_sections_section_idx on public.test_template_sections(section_id);
create index if not exists test_templates_blueprint_idx on public.test_templates(blueprint_id);
create index if not exists test_templates_stage_idx on public.test_templates(exam_stage_id);