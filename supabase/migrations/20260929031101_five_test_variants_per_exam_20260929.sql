-- Five measurable test variants per exam stage.
-- Reuses the approved 100-question pool and prebuilt test_question_sets architecture.

do $$
declare
  s record;
  v record;
  ready_count integer;
  set_rec record;
begin
  for s in
    select es.id as stage_id, ex.slug as exam_slug
    from public.exam_stages es
    join public.exams ex on ex.id = es.exam_id
    where ex.is_active = true and es.is_active = true
      and (
        select count(*) from public.questions q
        where q.exam_stage_id = es.id and q.language='en' and q.status='approved'
          and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
          and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
      ) >= 100
  loop
    update public.test_templates
    set is_active=false
    where exam_stage_id=s.stage_id and slug like '%-foundation-mock-100' and is_active=true;

    insert into public.test_templates (exam_stage_id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,selection_rules,requires_login,is_active)
    select s.stage_id,s.exam_slug||'-level-1-easy','Level 1 — Easy Practice',
      'A 20-question easy-level diagnostic using the approved exam question bank. Use this to establish baseline accuracy.',
      'practice',20,1200,1,0.25,array['en']::text[],
      '{"variant":"level_1","difficulty":{"easy":20},"pool_size":100,"catalog_order":1}'::jsonb,false,true
    where not exists(select 1 from public.test_templates where slug=s.exam_slug||'-level-1-easy');

    insert into public.test_templates (exam_stage_id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,selection_rules,requires_login,is_active)
    select s.stage_id,s.exam_slug||'-level-2-medium','Level 2 — Medium Practice',
      'A 20-question medium-level diagnostic focused on accuracy, application and time control.',
      'practice',20,1200,1,0.25,array['en']::text[],
      '{"variant":"level_2","difficulty":{"medium":20},"pool_size":100,"catalog_order":2}'::jsonb,false,true
    where not exists(select 1 from public.test_templates where slug=s.exam_slug||'-level-2-medium');

    insert into public.test_templates (exam_stage_id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,selection_rules,requires_login,is_active)
    select s.stage_id,s.exam_slug||'-level-3-hard','Level 3 — Hard Practice',
      'A 20-question advanced diagnostic prioritising hard questions from the approved bank, with controlled fallback when needed.',
      'practice',20,1200,1,0.25,array['en']::text[],
      '{"variant":"level_3","difficulty":{"hard":20,"fallback":"medium"},"pool_size":100,"catalog_order":3}'::jsonb,false,true
    where not exists(select 1 from public.test_templates where slug=s.exam_slug||'-level-3-hard');

    insert into public.test_templates (exam_stage_id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,selection_rules,requires_login,is_active)
    select s.stage_id,s.exam_slug||'-prelims-style-mock','Prelims-style Mock — 50 Questions',
      'A timed 50-question mixed-difficulty screening-style mock built from the approved exam pool. This is a practice format, not an official paper.',
      'mixed',50,1800,1,0.25,array['en']::text[],
      '{"variant":"prelims","mix":{"easy":22,"medium":19,"hard":9},"pool_size":100,"catalog_order":4}'::jsonb,false,true
    where not exists(select 1 from public.test_templates where slug=s.exam_slug||'-prelims-style-mock');

    insert into public.test_templates (exam_stage_id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,selection_rules,requires_login,is_active)
    select s.stage_id,s.exam_slug||'-full-mock-100','Full Mock — 100 Questions',
      'A complete 100-question mock using the full approved pool with the configured easy, medium and hard mix.',
      'full_mock',100,3600,1,0.25,array['en']::text[],
      '{"variant":"full_mock","difficulty":{"easy":44,"medium":37,"hard":19},"pool_size":100,"catalog_order":5}'::jsonb,false,true
    where not exists(select 1 from public.test_templates where slug=s.exam_slug||'-full-mock-100');

    update public.test_templates set is_active=true, selection_rules='{"variant":"level_1","difficulty":{"easy":20},"pool_size":100,"catalog_order":1}'::jsonb where slug=s.exam_slug||'-level-1-easy';
    update public.test_templates set is_active=true, selection_rules='{"variant":"level_2","difficulty":{"medium":20},"pool_size":100,"catalog_order":2}'::jsonb where slug=s.exam_slug||'-level-2-medium';
    update public.test_templates set is_active=true, selection_rules='{"variant":"level_3","difficulty":{"hard":20,"fallback":"medium"},"pool_size":100,"catalog_order":3}'::jsonb where slug=s.exam_slug||'-level-3-hard';
    update public.test_templates set is_active=true, selection_rules='{"variant":"prelims","mix":{"easy":22,"medium":19,"hard":9},"pool_size":100,"catalog_order":4}'::jsonb where slug=s.exam_slug||'-prelims-style-mock';
    update public.test_templates set is_active=true, selection_rules='{"variant":"full_mock","difficulty":{"easy":44,"medium":37,"hard":19},"pool_size":100,"catalog_order":5}'::jsonb where slug=s.exam_slug||'-full-mock-100';
  end loop;

  create temporary table tmp_variant_selected(question_id uuid primary key,position integer not null) on commit drop;

  for v in
    select tt.id,tt.exam_stage_id,tt.slug,tt.question_count
    from public.test_templates tt
    where tt.is_active=true and (
      tt.slug like '%-level-1-easy' or tt.slug like '%-level-2-medium'
      or tt.slug like '%-level-3-hard' or tt.slug like '%-prelims-style-mock'
      or tt.slug like '%-full-mock-100'
    )
  loop
    delete from tmp_variant_selected;

    if v.slug like '%-level-1-easy' then
      insert into tmp_variant_selected
      select q.id,row_number() over(order by md5(q.id::text||v.id::text||'l1'))::integer-1
      from public.questions q
      where q.exam_stage_id=v.exam_stage_id and q.language='en' and q.status='approved' and q.difficulty='easy'
        and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
        and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
      order by md5(q.id::text||v.id::text||'l1') limit 20;

    elsif v.slug like '%-level-2-medium' then
      insert into tmp_variant_selected
      select q.id,row_number() over(order by md5(q.id::text||v.id::text||'l2'))::integer-1
      from public.questions q
      where q.exam_stage_id=v.exam_stage_id and q.language='en' and q.status='approved' and q.difficulty='medium'
        and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
        and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
      order by md5(q.id::text||v.id::text||'l2') limit 20;

    elsif v.slug like '%-level-3-hard' then
      insert into tmp_variant_selected
      select q.id,row_number() over(order by md5(q.id::text||v.id::text||'l3h'))::integer-1
      from public.questions q
      where q.exam_stage_id=v.exam_stage_id and q.language='en' and q.status='approved' and q.difficulty='hard'
        and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
        and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
      order by md5(q.id::text||v.id::text||'l3h') limit 20;
      ready_count := (select count(*) from tmp_variant_selected);
      if ready_count < 20 then
        insert into tmp_variant_selected
        select q.id,ready_count+row_number() over(order by md5(q.id::text||v.id::text||'l3f'))::integer-1
        from public.questions q
        where q.exam_stage_id=v.exam_stage_id and q.language='en' and q.status='approved' and q.difficulty='medium'
          and not exists(select 1 from tmp_variant_selected x where x.question_id=q.id)
          and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
          and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
        order by md5(q.id::text||v.id::text||'l3f') limit (20-ready_count);
      end if;

    elsif v.slug like '%-prelims-style-mock' then
      insert into tmp_variant_selected
      select q.id,row_number() over(order by
        case q.difficulty when 'easy' then 1 when 'medium' then 2 when 'hard' then 3 else 4 end,
        md5(q.id::text||v.id::text||'pre'))::integer-1
      from public.questions q
      where q.exam_stage_id=v.exam_stage_id and q.language='en' and q.status='approved'
        and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
        and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
      order by case q.difficulty when 'easy' then 1 when 'medium' then 2 when 'hard' then 3 else 4 end,
               md5(q.id::text||v.id::text||'pre') limit 50;

    else
      insert into tmp_variant_selected
      select q.id,row_number() over(order by
        case q.difficulty when 'easy' then 1 when 'medium' then 2 when 'hard' then 3 else 4 end,
        md5(q.id::text||v.id::text||'full'))::integer-1
      from public.questions q
      where q.exam_stage_id=v.exam_stage_id and q.language='en' and q.status='approved'
        and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
        and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
      order by case q.difficulty when 'easy' then 1 when 'medium' then 2 when 'hard' then 3 else 4 end,
               md5(q.id::text||v.id::text||'full') limit 100;
    end if;

    if (select count(*) from tmp_variant_selected)=v.question_count then
      insert into public.test_question_sets(test_template_id,language,question_count,set_number,version,is_active)
      values(v.id,'en',v.question_count,1,1,true)
      on conflict(test_template_id,language,question_count,set_number,version)
      do update set is_active=true
      returning * into set_rec;
      delete from public.test_question_set_items where set_id=set_rec.id;
      insert into public.test_question_set_items(set_id,question_id,position)
      select set_rec.id,question_id,position from tmp_variant_selected order by position;
    end if;
  end loop;
end $$;
