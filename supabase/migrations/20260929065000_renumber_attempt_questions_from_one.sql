create or replace function public.mock_start_attempt(
  p_test_template_id uuid,
  p_language text,
  p_question_count integer,
  p_guest_token text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  t public.test_templates%rowtype;
  s public.test_question_sets%rowtype;
  attempt_id uuid;
  uid uuid := auth.uid();
  effective_guest text := nullif(trim(p_guest_token),'');
  requested integer := p_question_count;
  item_count integer;
  valid_count integer;
begin
  select * into t from public.test_templates
  where id=p_test_template_id and is_active=true;
  if not found then raise exception 'Test not found.' using errcode='P0002'; end if;

  if t.requires_login and uid is null then raise exception 'Authentication required.' using errcode='P0001'; end if;
  if uid is null and effective_guest is null then raise exception 'Guest token required.' using errcode='P0001'; end if;
  if not(p_language=any(t.supported_languages)) then raise exception 'Selected language is not available for this test.' using errcode='P0001'; end if;

  if t.duration_seconds=600 then
    if requested not in(5,10,15,20) then raise exception 'For the 10-minute speed test, choose 5, 10, 15 or 20 questions.' using errcode='P0001'; end if;
  elsif requested<>t.question_count then
    raise exception 'This test uses its configured question count.' using errcode='P0001';
  end if;

  select * into s from public.test_question_sets
  where test_template_id=t.id and language=p_language and question_count=requested
    and set_number=coalesce((t.selection_rules->>'set_number')::integer,1)
    and is_active=true
  order by version desc limit 1;

  if not found then raise exception 'This test does not have a prepared question set for the selected question count yet.' using errcode='P0002'; end if;

  select count(*) into item_count from public.test_question_set_items where set_id=s.id;
  if item_count<>requested then raise exception 'This prepared test set is incomplete. Please try another test.' using errcode='P0001'; end if;

  select count(*) into valid_count from (
    select qq.id
    from public.test_question_set_items i
    join public.questions qq on qq.id=i.question_id
    join public.question_options o on o.question_id=qq.id
    where i.set_id=s.id
    group by qq.id
    having count(o.id)=4 and count(*) filter(where o.is_correct)=1
  ) x;
  if valid_count<>requested then raise exception 'This prepared test set contains an invalid question. Please try another test.' using errcode='P0001'; end if;

  insert into public.test_attempts(user_id,guest_token,test_template_id,language,question_count,duration_seconds,status)
  values(uid,case when uid is null then effective_guest else null end,t.id,p_language,requested,t.duration_seconds,'in_progress')
  returning id into attempt_id;

  insert into public.test_attempt_questions(attempt_id,question_id,position)
  select attempt_id,question_id,row_number() over(order by position)-1
  from public.test_question_set_items
  where set_id=s.id
  order by position;

  return attempt_id;
end
$function$;
