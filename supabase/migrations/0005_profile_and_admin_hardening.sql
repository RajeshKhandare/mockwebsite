-- Create a profile automatically when a Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''))
  on conflict (id) do nothing;
  insert into public.performance_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create unique index if not exists test_attempt_questions_attempt_question_uidx
on public.test_attempt_questions(attempt_id, question_id);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "admin users own membership" on public.admin_users;
create policy "admin users own membership"
on public.admin_users for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "admins can read question pool" on public.questions;
create policy "admins can read question pool"
on public.questions for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admins can read question options" on public.question_options;
create policy "admins can read question options"
on public.question_options for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

grant select on table public.questions, public.question_options to authenticated;
