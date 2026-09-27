begin;
select plan(18);

select has_table('public','profiles','profiles table exists');
select has_table('public','exams','exams table exists');
select has_table('public','exam_stages','exam stages table exists');
select has_table('public','questions','questions table exists');
select has_table('public','question_options','question options table exists');
select has_table('public','question_batches','question batches table exists');
select has_table('public','question_validation_runs','validation runs table exists');
select has_table('public','question_reviews','question reviews table exists');
select has_table('public','question_quality_metrics','quality metrics table exists');
select has_table('public','test_templates','test templates table exists');
select has_table('public','test_attempts','attempts table exists');
select has_table('public','test_answers','answers table exists');
select has_table('public','results','results table exists');
select has_table('public','performance_topic_stats','topic performance table exists');
select has_table('public','question_reports','question reports table exists');
select has_column('public','questions','question_hash','question fingerprint exists');
select has_column('public','questions','quality_score','quality score exists');
select has_column('public','test_templates','selection_rules','test blueprint rules exist');

select * from finish();
rollback;