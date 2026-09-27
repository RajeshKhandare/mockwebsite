-- Explicit RLS coverage for server-managed content and the admin identity lookup.
create policy "admin own row" on public.admin_users for select to authenticated using((select auth.uid())=user_id);
create policy "question batches are server managed" on public.question_batches for all to anon,authenticated using(false) with check(false);
create policy "question quality metrics are server managed" on public.question_quality_metrics for all to anon,authenticated using(false) with check(false);
create policy "question reviews are server managed" on public.question_reviews for all to anon,authenticated using(false) with check(false);
create policy "question validation runs are server managed" on public.question_validation_runs for all to anon,authenticated using(false) with check(false);
create policy "question versions are server managed" on public.question_versions for all to anon,authenticated using(false) with check(false);