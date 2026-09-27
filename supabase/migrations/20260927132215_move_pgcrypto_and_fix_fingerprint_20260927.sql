-- Keep pgcrypto outside the exposed public schema and qualify digest() for hardened functions.
create schema if not exists extensions;
alter extension pgcrypto set schema extensions;
create or replace function public.set_question_fingerprint() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
  new.normalized_text := public.question_normalize(new.question_text);
  new.question_hash := encode(extensions.digest(new.normalized_text,'sha256'),'hex');
  return new;
end; $$;
revoke execute on function public.set_question_fingerprint() from public,anon,authenticated;