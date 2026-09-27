-- Deterministic question QC gate. Questions that pass all structural, metadata and near-duplicate checks enter the approved pool automatically.
create or replace function public.validate_question(question_id_input uuid) returns jsonb
language plpgsql security definer set search_path=''
as $$
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
 result:=jsonb_build_object('ok',true,'schema_valid',q.question_text<>'','four_options',option_count=4,'one_correct',correct_count=1,
   'explanation_present',coalesce(length(trim(q.explanation)),0)>0,'metadata_valid',q.exam_stage_id is not null and q.subject_id is not null and q.topic_id is not null,
   'duplicate_similarity',round(duplicate_similarity::numeric,4),'passed',passed);
 update public.questions set normalized_text=public.question_normalize(q.question_text),
   validation_status=case when passed then 'passed' when option_count=4 and correct_count=1 and duplicate_similarity<0.93 then 'needs_review' else 'failed' end,
   review_required=not passed, auto_decision=case when passed then 'approved' when option_count=4 and correct_count=1 and duplicate_similarity<0.93 then 'review' else 'rejected' end,
   status=case when passed then 'approved' when option_count=4 and correct_count=1 and duplicate_similarity<0.93 then 'needs_review' else 'rejected' end,
   approved_at=case when passed then coalesce(approved_at,now()) else approved_at end, updated_at=now()
 where id=question_id_input;
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
revoke execute on function public.validate_question(uuid) from public,anon,authenticated;