-- Prebuilt question sets: deterministic test variants for production-safe starts.
create table if not exists public.test_question_sets (
  id uuid primary key default gen_random_uuid(),
  test_template_id uuid not null references public.test_templates(id) on delete cascade,
  language text not null check (language in ('en','hi','mr')),
  question_count integer not null check (question_count > 0 and question_count <= 100),
  set_number integer not null check (set_number > 0),
  version integer not null default 1 check (version > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (test_template_id, language, question_count, set_number, version)
);

create table if not exists public.test_question_set_items (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.test_question_sets(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (set_id, question_id),
  unique (set_id, position)
);

create index if not exists idx_test_question_sets_template_lookup
  on public.test_question_sets(test_template_id, language, question_count, is_active);

create index if not exists idx_test_question_set_items_set_position
  on public.test_question_set_items(set_id, position);

create index if not exists idx_test_question_set_items_question
  on public.test_question_set_items(question_id);

alter table public.test_question_sets enable row level security;
alter table public.test_question_set_items enable row level security;

revoke all on public.test_question_sets from anon, authenticated;
revoke all on public.test_question_set_items from anon, authenticated;
grant select, insert, update, delete on public.test_question_sets to service_role;
grant select, insert, update, delete on public.test_question_set_items to service_role;

do $$
declare
  t record;
  lang text;
  target_count integer;
  set_rec record;
  desired_easy integer;
  desired_medium integer;
  desired_hard integer;
  remaining integer;
  pool_count integer;
begin
  create temporary table tmp_selected_questions (
    question_id uuid primary key,
    position integer not null
  ) on commit drop;

  for t in
    select id, question_count, duration_seconds, supported_languages, selection_rules, exam_stage_id
    from public.test_templates
    where is_active = true
  loop
    foreach lang in array t.supported_languages
    loop
      if t.duration_seconds = 600 then
        foreach target_count in array array[5,10,15,20]
        loop
          delete from tmp_selected_questions;

          select count(*) into pool_count
          from public.questions q
          where q.exam_stage_id=t.exam_stage_id and q.language=lang and q.status='approved'
            and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
            and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1;

          if pool_count >= target_count then
            insert into tmp_selected_questions(question_id, position)
            select q.id, row_number() over(order by md5(q.id::text || t.id::text || lang))::integer - 1
            from public.questions q
            where q.exam_stage_id=t.exam_stage_id and q.language=lang and q.status='approved'
              and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
              and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
            order by md5(q.id::text || t.id::text || lang)
            limit target_count;

            insert into public.test_question_sets(test_template_id,language,question_count,set_number,version,is_active)
            values(t.id,lang,target_count,1,1,true)
            on conflict (test_template_id,language,question_count,set_number,version)
            do update set is_active=true
            returning * into set_rec;

            delete from public.test_question_set_items where set_id=set_rec.id;
            insert into public.test_question_set_items(set_id,question_id,position)
            select set_rec.id, question_id, position from tmp_selected_questions order by position;
          end if;
        end loop;
      else
        target_count := t.question_count;
        delete from tmp_selected_questions;

        desired_easy := coalesce((t.selection_rules->'difficulty'->>'easy')::integer,0);
        desired_medium := coalesce((t.selection_rules->'difficulty'->>'medium')::integer,0);
        desired_hard := coalesce((t.selection_rules->'difficulty'->>'hard')::integer,0);

        if desired_easy > 0 then
          insert into tmp_selected_questions(question_id,position)
          select q.id, row_number() over(order by md5(q.id::text || t.id::text || lang || 'easy'))::integer - 1
          from public.questions q
          where q.exam_stage_id=t.exam_stage_id and q.language=lang and q.status='approved' and q.difficulty='easy'
            and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
            and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
          order by md5(q.id::text || t.id::text || lang || 'easy')
          limit desired_easy;
        end if;

        if desired_medium > 0 then
          insert into tmp_selected_questions(question_id,position)
          select q.id, (select count(*) from tmp_selected_questions)
            + row_number() over(order by md5(q.id::text || t.id::text || lang || 'medium'))::integer - 1
          from public.questions q
          where q.exam_stage_id=t.exam_stage_id and q.language=lang and q.status='approved' and q.difficulty='medium'
            and not exists (select 1 from tmp_selected_questions s where s.question_id=q.id)
            and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
            and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
          order by md5(q.id::text || t.id::text || lang || 'medium')
          limit desired_medium;
        end if;

        if desired_hard > 0 then
          insert into tmp_selected_questions(question_id,position)
          select q.id, (select count(*) from tmp_selected_questions)
            + row_number() over(order by md5(q.id::text || t.id::text || lang || 'hard'))::integer - 1
          from public.questions q
          where q.exam_stage_id=t.exam_stage_id and q.language=lang and q.status='approved' and q.difficulty='hard'
            and not exists (select 1 from tmp_selected_questions s where s.question_id=q.id)
            and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
            and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
          order by md5(q.id::text || t.id::text || lang || 'hard')
          limit desired_hard;
        end if;

        select count(*) into remaining from tmp_selected_questions;
        remaining := target_count - remaining;

        if remaining > 0 then
          insert into tmp_selected_questions(question_id,position)
          select q.id, (select count(*) from tmp_selected_questions)
            + row_number() over(order by md5(q.id::text || t.id::text || lang || 'fill'))::integer - 1
          from public.questions q
          where q.exam_stage_id=t.exam_stage_id and q.language=lang and q.status='approved'
            and not exists (select 1 from tmp_selected_questions s where s.question_id=q.id)
            and (select count(*) from public.question_options qo where qo.question_id=q.id)=4
            and (select count(*) from public.question_options qo where qo.question_id=q.id and qo.is_correct)=1
          order by md5(q.id::text || t.id::text || lang || 'fill')
          limit remaining;
        end if;

        if (select count(*) from tmp_selected_questions) = target_count then
          insert into public.test_question_sets(test_template_id,language,question_count,set_number,version,is_active)
          values(t.id,lang,target_count,1,1,true)
          on conflict (test_template_id,language,question_count,set_number,version)
          do update set is_active=true
          returning * into set_rec;

          delete from public.test_question_set_items where set_id=set_rec.id;
          insert into public.test_question_set_items(set_id,question_id,position)
          select set_rec.id, question_id, position from tmp_selected_questions order by position;
        end if;
      end if;
    end loop;
  end loop;
end $$;
