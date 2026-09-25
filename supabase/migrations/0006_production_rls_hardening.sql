-- Production hardening for a fresh Supabase deployment.

alter table public.test_templates
  add constraint test_templates_slug_key unique (slug);

drop policy if exists "public active exams" on public.exams;
create policy "public active exams" on public.exams
for select to anon, authenticated using (is_active = true);

drop policy if exists "public active stages" on public.exam_stages;
create policy "public active stages" on public.exam_stages
for select to anon, authenticated using (
  exists (select 1 from public.exams e where e.id = exam_id and e.is_active = true)
);

drop policy if exists "public active subjects" on public.subjects;
create policy "public active subjects" on public.subjects
for select to anon, authenticated using (
  exists (
    select 1
    from public.exam_stage_subjects ess
    join public.exam_stages s on s.id = ess.exam_stage_id
    join public.exams e on e.id = s.exam_id
    where ess.subject_id = subjects.id and e.is_active = true
  )
);

drop policy if exists "public active topics" on public.topics;
create policy "public active topics" on public.topics
for select to anon, authenticated using (
  exists (
    select 1
    from public.exam_stage_subjects ess
    join public.exam_stages s on s.id = ess.exam_stage_id
    join public.exams e on e.id = s.exam_id
    where ess.subject_id = topics.subject_id and e.is_active = true
  )
);

drop policy if exists "public active templates" on public.test_templates;
create policy "public active templates" on public.test_templates
for select to anon, authenticated using (
  is_active = true
  and (
    exam_stage_id is null
    or exists (
      select 1 from public.exam_stages s
      join public.exams e on e.id = s.exam_id
      where s.id = test_templates.exam_stage_id and e.is_active = true
    )
  )
);

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
