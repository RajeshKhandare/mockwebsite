do $$ begin
if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='own profile insert') then
  create policy "own profile insert" on public.profiles for insert with check ((select auth.uid()) = id);
end if;
end $$;
