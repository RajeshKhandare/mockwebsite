-- Original demo content only. It is not presented as an official exam paper.
-- Run after supabase/schema.sql (or its migration).

insert into public.exam_categories (slug, name, description, sort_order, is_active)
values ('banking', 'Banking', 'Competitive exam preparation for banking recruitment.', 1, true)
on conflict (slug) do update set name = excluded.name, is_active = true;

insert into public.exams (category_id, slug, name, description, is_active)
select c.id, 'banking-demo', 'Banking Aptitude Demo', 'A small original mock-test dataset used to verify the complete test flow.', true
from public.exam_categories c where c.slug = 'banking'
on conflict (slug) do update set is_active = true;

insert into public.exam_stages (exam_id, slug, name, description, sort_order)
select e.id, 'prelims', 'Prelims', 'Demo stage for the first end-to-end test flow.', 1
from public.exams e where e.slug = 'banking-demo'
on conflict (exam_id, slug) do update set name = excluded.name;

insert into public.subjects (slug, name)
values ('quantitative-aptitude', 'Quantitative Aptitude'), ('reasoning-ability', 'Reasoning Ability')
on conflict (slug) do nothing;

insert into public.exam_stage_subjects (exam_stage_id, subject_id, sort_order)
select s.id, sub.id, row_number() over (order by sub.slug)
from public.exam_stages s join public.exams e on e.id = s.exam_id cross join public.subjects sub
where e.slug = 'banking-demo' and s.slug = 'prelims'
on conflict do nothing;

insert into public.sections (exam_stage_id, subject_id, slug, name, sort_order)
select s.id, sub.id, 'aptitude-core', 'Aptitude Core', 1
from public.exam_stages s join public.exams e on e.id = s.exam_id
join public.subjects sub on sub.slug = 'quantitative-aptitude'
where e.slug = 'banking-demo' and s.slug = 'prelims'
on conflict (exam_stage_id, slug) do nothing;

insert into public.topics (subject_id, slug, name)
values
  ((select id from public.subjects where slug = 'quantitative-aptitude'), 'arithmetic', 'Arithmetic'),
  ((select id from public.subjects where slug = 'reasoning-ability'), 'logic', 'Logic')
on conflict (subject_id, slug) do nothing;

insert into public.test_templates (
  exam_stage_id, slug, title, description, test_type, question_count,
  duration_seconds, marks_per_question, negative_marks, supported_languages, is_active
)
select s.id, 'banking-demo-quick-01', 'Banking Aptitude Quick Mock',
  'Five original questions for verifying the complete mock-test workflow.',
  'full_mock', 5, 600, 1, 0.25, array['en','hi','mr'], true
from public.exam_stages s join public.exams e on e.id = s.exam_id
where e.slug = 'banking-demo' and s.slug = 'prelims'
on conflict (slug) do update set is_active = true, question_count = 5, duration_seconds = 600;

with seed_questions(language, question_text, explanation, difficulty, correct_option, options) as (
  values
  ('en', 'If 20% of a number is 36, what is the number?', '20% of 180 is 36.', 'easy', 0, '["180","160","200","140"]'::jsonb),
  ('en', 'A train travels 120 km in 2 hours. What is its average speed?', 'Average speed is distance divided by time: 120 ÷ 2 = 60 km/h.', 'easy', 1, '["50 km/h","60 km/h","70 km/h","80 km/h"]'::jsonb),
  ('en', 'What is the next number in the series 2, 6, 12, 20, ?', 'The differences are 4, 6, 8, so the next difference is 10 and the answer is 30.', 'medium', 3, '["28","32","36","30"]'::jsonb),
  ('en', 'If all roses are flowers and some flowers fade quickly, which statement is definitely true?', 'Every rose is a flower because that is the first premise.', 'easy', 2, '["All flowers are roses","Some roses fade quickly","All roses are flowers","No rose fades quickly"]'::jsonb),
  ('en', 'A shop gives a 10% discount on an item priced at 500. What is the sale price?', 'Ten percent of 500 is 50, so the sale price is 450.', 'easy', 0, '["450","460","475","490"]'::jsonb),
  ('hi', 'किसी संख्या का 20% 36 है। वह संख्या क्या है?', '180 का 20% 36 होता है।', 'easy', 0, '["180","160","200","140"]'::jsonb),
  ('hi', 'एक ट्रेन 2 घंटे में 120 किमी चलती है। उसकी औसत गति क्या है?', 'औसत गति = दूरी ÷ समय = 120 ÷ 2 = 60 किमी/घंटा।', 'easy', 1, '["50 किमी/घंटा","60 किमी/घंटा","70 किमी/घंटा","80 किमी/घंटा"]'::jsonb),
  ('hi', 'श्रृंखला 2, 6, 12, 20, ? में अगली संख्या क्या होगी?', 'अंतर 4, 6, 8 हैं। अगला अंतर 10 होगा, इसलिए उत्तर 30 है।', 'medium', 3, '["28","32","36","30"]'::jsonb),
  ('hi', 'यदि सभी गुलाब फूल हैं और कुछ फूल जल्दी मुरझाते हैं, तो कौन-सा कथन निश्चित रूप से सही है?', 'पहले कथन के अनुसार प्रत्येक गुलाब एक फूल है।', 'easy', 2, '["सभी फूल गुलाब हैं","कुछ गुलाब जल्दी मुरझाते हैं","सभी गुलाब फूल हैं","कोई गुलाब नहीं मुरझाता"]'::jsonb),
  ('hi', '500 रुपये की वस्तु पर 10% छूट है। बिक्री मूल्य क्या होगा?', '500 का 10% 50 है, इसलिए बिक्री मूल्य 450 रुपये है।', 'easy', 0, '["450","460","475","490"]'::jsonb),
  ('mr', 'एका संख्येच्या 20% ची किंमत 36 आहे. ती संख्या किती?', '180 च्या 20% ची किंमत 36 होते.', 'easy', 0, '["180","160","200","140"]'::jsonb),
  ('mr', 'एक रेल्वे 2 तासांत 120 किमी अंतर कापते. तिचा सरासरी वेग किती?', 'सरासरी वेग = अंतर ÷ वेळ = 120 ÷ 2 = 60 किमी/तास.', 'easy', 1, '["50 किमी/तास","60 किमी/तास","70 किमी/तास","80 किमी/तास"]'::jsonb),
  ('mr', 'मालिका 2, 6, 12, 20, ? मध्ये पुढील संख्या कोणती?', 'फरक 4, 6, 8 आहेत. पुढील फरक 10 असल्याने उत्तर 30 आहे.', 'medium', 3, '["28","32","36","30"]'::jsonb),
  ('mr', 'सर्व गुलाब फुले आहेत आणि काही फुले लवकर कोमेजतात. खालीलपैकी निश्चितपणे बरोबर विधान कोणते?', 'पहिल्या विधानानुसार प्रत्येक गुलाब हे फूल आहे.', 'easy', 2, '["सर्व फुले गुलाब आहेत","काही गुलाब लवकर कोमेजतात","सर्व गुलाब फुले आहेत","कोणताही गुलाब कोमेजत नाही"]'::jsonb),
  ('mr', '500 रुपयांच्या वस्तूवर 10% सूट आहे. विक्री किंमत किती?', '500 च्या 10% ची किंमत 50 आहे, त्यामुळे विक्री किंमत 450 रुपये आहे.', 'easy', 0, '["450","460","475","490"]'::jsonb)
),
inserted as (
  insert into public.questions (
    exam_stage_id, subject_id, topic_id, section_id, language,
    question_text, explanation, difficulty, status, source_type
  )
  select
    (select s.id from public.exam_stages s join public.exams e on e.id = s.exam_id where e.slug = 'banking-demo' and s.slug = 'prelims'),
    (select id from public.subjects where slug = 'quantitative-aptitude'),
    (select id from public.topics where slug = 'arithmetic' and subject_id = (select id from public.subjects where slug = 'quantitative-aptitude')),
    (select sec.id from public.sections sec join public.exam_stages s on s.id = sec.exam_stage_id join public.exams e on e.id = s.exam_id where e.slug = 'banking-demo' and s.slug = 'prelims' limit 1),
    language, question_text, explanation, difficulty, 'approved', 'original'
  from seed_questions
  where not exists (
    select 1 from public.questions q
    where q.exam_stage_id = (select s.id from public.exam_stages s join public.exams e on e.id = s.exam_id where e.slug = 'banking-demo' and s.slug = 'prelims')
      and q.language = seed_questions.language and q.question_text = seed_questions.question_text
  )
  returning id, question_text
)
insert into public.question_options(question_id, option_index, option_text, is_correct)
select i.id, opts.ordinality - 1, opts.value,
  opts.ordinality - 1 = (select sq.correct_option from seed_questions sq where sq.question_text = i.question_text)
from inserted i
join seed_questions sq on sq.question_text = i.question_text
cross join lateral jsonb_array_elements_text(sq.options) with ordinality opts(value, ordinality)
on conflict (question_id, option_index) do nothing;
