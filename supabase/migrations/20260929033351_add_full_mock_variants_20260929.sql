do $$
declare
  base record;
  n integer;
  new_id uuid;
  prepared_set_id uuid;
begin
  for base in
    select tt.*, es.id stage_id, e.slug exam_slug
    from public.test_templates tt
    join public.exam_stages es on es.id=tt.exam_stage_id
    join public.exams e on e.id=es.exam_id
    where tt.is_active=true and tt.slug like '%-full-mock-100'
      and tt.slug !~ '-[0-9]{2}$'
  loop
    for n in 2..5 loop
      new_id := null;
      select id into new_id from public.test_templates
      where slug=base.exam_slug || '-full-mock-100-' || lpad(n::text,2,'0') limit 1;
      if new_id is null then
        insert into public.test_templates(
          exam_stage_id,slug,title,description,test_type,question_count,duration_seconds,
          marks_per_question,negative_marks,supported_languages,selection_rules,requires_login,is_active
        ) values(
          base.stage_id,
          base.exam_slug || '-full-mock-100-' || lpad(n::text,2,'0'),
          regexp_replace(base.title,' — 100 Questions$','') || ' — Set ' || lpad(n::text,2,'0') || ' · 100 Questions',
          'A 100-question full mock variant using the approved exam question bank. Question order is prebuilt and stable for this test set.',
          base.test_type,100,base.duration_seconds,base.marks_per_question,base.negative_marks,
          base.supported_languages,
          coalesce(base.selection_rules,'{}'::jsonb) || jsonb_build_object('set_number',n,'catalog_order',5+n),
          true,true
        ) returning id into new_id;
      end if;

      prepared_set_id := null;
      select s.id into prepared_set_id from public.test_question_sets s
      where s.test_template_id=new_id and s.language='en' and s.question_count=100 and s.set_number=1 and s.version=1 limit 1;

      if prepared_set_id is null then
        insert into public.test_question_sets(test_template_id,language,question_count,set_number,version,is_active)
        values(new_id,'en',100,1,1,true) returning id into prepared_set_id;
      else
        update public.test_question_sets set is_active=true where id=prepared_set_id;
      end if;

      delete from public.test_question_set_items i where i.set_id=prepared_set_id;

      insert into public.test_question_set_items(set_id,question_id,position)
      select prepared_set_id,i.question_id,((i.position + (n-1)*17) % 100) as new_position
      from public.test_question_sets source_set
      join public.test_question_set_items i on i.set_id=source_set.id
      where source_set.test_template_id=base.id
        and source_set.language='en'
        and source_set.question_count=100
        and source_set.set_number=1
        and source_set.is_active;
    end loop;
  end loop;
end $$;

update public.test_templates
set selection_rules = coalesce(selection_rules,'{}'::jsonb) || jsonb_build_object('set_number',1)
where is_active and slug like '%-full-mock-100' and slug !~ '-[0-9]{2}$';