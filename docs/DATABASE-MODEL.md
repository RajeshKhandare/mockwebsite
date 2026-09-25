# Database Model

## Core entities

### profiles
id, display_name, avatar_url, created_at, updated_at

### exams
id, slug, name, organization, description, active, pattern_version, created_at, updated_at

### exam_stages
id, exam_id, slug, name, duration_seconds, total_questions, total_marks, negative_marking, navigation_rules, active

### subjects
id, stage_id, slug, name, display_order, active

### topics
id, subject_id, slug, name, display_order, active

### questions
id, exam_id, stage_id, subject_id, topic_id, question_group_id, difficulty, language, stem, explanation, correct_option_key, status, source_batch_id, created_at, updated_at

### question_options
id, question_id, option_key, option_text, display_order

### test_templates
id, exam_id, stage_id, type, name, question_count, duration_seconds, marks_per_question, negative_marking, language_support, selection_rules, active

### test_attempts
id, user_id, template_id, language, started_at, submitted_at, status, duration_seconds, score, accuracy, attempted_count, correct_count, incorrect_count, unattempted_count

### test_attempt_questions
id, attempt_id, question_id, sequence_number, marked_for_review, selected_option_key, visited_at

### test_answers
id, attempt_question_id, selected_option_key, answered_at, changed_at

### results
id, attempt_id, section_metrics, topic_metrics, score_breakdown, generated_at

### performance_stats
id, user_id, scope_type, scope_id, attempts, accuracy, average_time_seconds, trend_data, updated_at

### user_preferences
user_id, preferred_language, theme, notification_preferences

### admin_users
user_id, role, active, created_at

## Security
RLS on all user-owned tables. Admin-only writes protected by role policies and server authorization.

## Indexing
Index foreign keys, public slugs, active flags, attempt ownership, attempt timestamps, question filtering dimensions and status.
