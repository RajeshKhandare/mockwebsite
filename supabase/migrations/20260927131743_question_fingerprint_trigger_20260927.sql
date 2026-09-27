-- Keep question fingerprints consistent for imported, AI-generated and manually authored questions.
create or replace function public.set_question_fingerprint() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
  new.normalized_text := public.question_normalize(new.question_text);
  new.question_hash := encode(digest(new.normalized_text,'sha256'),'hex');
  return new;
end; $$;
revoke execute on function public.set_question_fingerprint() from public,anon,authenticated;
drop trigger if exists set_question_fingerprint_before_insert on public.questions;
create trigger set_question_fingerprint_before_insert before insert or update of question_text on public.questions
for each row execute procedure public.set_question_fingerprint();