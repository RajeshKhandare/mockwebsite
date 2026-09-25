-- Allow authenticated students to read only the question content assigned to their own attempt.
-- Correct-answer flags remain server-only because question_options.is_correct is never selected by the app API.

drop policy if exists "attempt questions can read linked questions" on public.questions;
create policy "attempt questions can read linked questions" on public.questions
for select to authenticated
using (
  exists (
    select 1
    from public.test_attempt_questions aq
    join public.test_attempts a on a.id = aq.attempt_id
    where aq.question_id = questions.id and a.user_id = auth.uid()
  )
);

drop policy if exists "attempt questions can read linked options" on public.question_options;
create policy "attempt questions can read linked options" on public.question_options
for select to authenticated
using (
  exists (
    select 1
    from public.test_attempt_questions aq
    join public.test_attempts a on a.id = aq.attempt_id
    where aq.question_id = question_options.question_id and a.user_id = auth.uid()
  )
);

grant select on table public.questions, public.question_options to authenticated;
