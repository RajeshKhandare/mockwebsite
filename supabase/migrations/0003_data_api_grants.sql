
-- Explicit Data API grants. RLS policies above remain the row-level boundary.
revoke all on table public.exam_categories, public.exams, public.exam_stages, public.subjects,
  public.exam_stage_subjects, public.sections, public.topics, public.test_templates,
  public.test_template_sections, public.profiles, public.test_attempts,
  public.test_attempt_questions, public.test_answers, public.results,
  public.performance_stats, public.user_preferences, public.questions,
  public.question_options, public.admin_users from anon, authenticated;

grant select on table public.exam_categories, public.exams, public.exam_stages, public.subjects,
  public.exam_stage_subjects, public.sections, public.topics, public.test_templates,
  public.test_template_sections to anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.test_attempts to authenticated;
grant select on table public.test_attempt_questions to authenticated;
grant select, insert, update on table public.test_answers to authenticated;
grant select on table public.results to authenticated;
grant select on table public.performance_stats to authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

grant all on table public.exam_categories, public.exams, public.exam_stages, public.subjects,
  public.exam_stage_subjects, public.sections, public.topics, public.questions,
  public.question_options, public.test_templates, public.test_template_sections,
  public.test_attempts, public.test_attempt_questions, public.test_answers, public.results,
  public.performance_stats, public.user_preferences, public.profiles, public.admin_users to service_role;

-- This migration applies the explicit least-privilege Data API grants to an existing project.
