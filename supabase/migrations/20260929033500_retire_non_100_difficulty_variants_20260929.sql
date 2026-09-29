-- Retire the earlier 20/50-question difficulty variants; the new catalogue publishes
-- only 100-question difficulty-specific sets once their pure question bank is complete.
update public.test_templates
set is_active=false
where is_active
  and (
    slug like '%-level-1-easy'
    or slug like '%-level-2-medium'
    or slug like '%-level-3-hard'
    or slug like '%-prelims-style-mock'
  );