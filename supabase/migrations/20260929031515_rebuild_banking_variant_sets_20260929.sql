-- Rebuild banking variant sets after adding the hard-question layer.
create temporary table tmp_bank_rebuild(question_id uuid primary key, position int not null);

do $$
declare tid uuid; sid uuid;
begin
  select id into tid from public.test_templates where slug='banking-demo-prelims-style-mock';
  select id into sid from public.test_question_sets where test_template_id=tid and language='en' and question_count=50 and set_number=1 and is_active;
  delete from public.test_question_set_items where set_id=sid;
  truncate tmp_bank_rebuild;
  insert into tmp_bank_rebuild
  select q.id,row_number() over(order by md5(q.id::text||tid::text||'pre'))::int-1
  from public.questions q
  where q.exam_stage_id=(select exam_stage_id from public.test_templates where id=tid)
    and q.language='en' and q.status='approved'
    and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
    and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
    and q.difficulty='easy'
  order by md5(q.id::text||tid::text||'pre') limit 22;
  insert into tmp_bank_rebuild
  select q.id,(select count(*) from tmp_bank_rebuild)+row_number() over(order by md5(q.id::text||tid::text||'pre'))::int-1
  from public.questions q
  where q.exam_stage_id=(select exam_stage_id from public.test_templates where id=tid)
    and q.language='en' and q.status='approved' and q.difficulty='medium'
    and not exists(select 1 from tmp_bank_rebuild x where x.question_id=q.id)
    and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
    and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
  order by md5(q.id::text||tid::text||'pre') limit 19;
  insert into tmp_bank_rebuild
  select q.id,(select count(*) from tmp_bank_rebuild)+row_number() over(order by md5(q.id::text||tid::text||'pre'))::int-1
  from public.questions q
  where q.exam_stage_id=(select exam_stage_id from public.test_templates where id=tid)
    and q.language='en' and q.status='approved' and q.difficulty='hard'
    and not exists(select 1 from tmp_bank_rebuild x where x.question_id=q.id)
    and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
    and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
  order by md5(q.id::text||tid::text||'pre') limit 9;
  insert into public.test_question_set_items(set_id,question_id,position) select sid,question_id,position from tmp_bank_rebuild;
end $$;

do $$
declare tid uuid; sid uuid;
begin
  select id into tid from public.test_templates where slug='banking-demo-full-mock-100';
  select id into sid from public.test_question_sets where test_template_id=tid and language='en' and question_count=100 and set_number=1 and is_active;
  delete from public.test_question_set_items where set_id=sid;
  truncate tmp_bank_rebuild;
  insert into tmp_bank_rebuild
  select q.id,row_number() over(order by
    case q.difficulty when 'easy' then 1 when 'medium' then 2 when 'hard' then 3 end,
    md5(q.id::text||tid::text||'full'))::int-1
  from public.questions q
  where q.exam_stage_id=(select exam_stage_id from public.test_templates where id=tid)
    and q.language='en' and q.status='approved'
    and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
    and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
  order by case q.difficulty when 'easy' then 1 when 'medium' then 2 when 'hard' then 3 end,
           md5(q.id::text||tid::text||'full') limit 100;
  insert into public.test_question_set_items(set_id,question_id,position) select sid,question_id,position from tmp_bank_rebuild;
end $$;
drop table tmp_bank_rebuild;