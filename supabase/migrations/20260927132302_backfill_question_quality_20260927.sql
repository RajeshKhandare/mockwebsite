-- Backfill deterministic QC metadata for existing seed/import content.
do $$
declare qid uuid;
begin
  for qid in select id from public.questions loop
    perform public.validate_question(qid);
  end loop;
end $$;