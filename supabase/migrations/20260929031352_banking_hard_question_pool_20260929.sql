-- Add a hard-question layer to the banking prelims pool so Level 3 remains meaningful.
do $$
declare
  stage_id uuid;
  quant_id uuid := 'e808b728-5ef8-4446-be8c-57f796fd784f';
  reasoning_id uuid := 'bc2bf5fd-39be-4ed7-8fc3-ed126495bc69';
  r record;
begin
  select es.id into stage_id from public.exam_stages es join public.exams e on e.id=es.exam_id where e.slug='banking-demo' and es.slug='prelims' limit 1;

  create temporary table tmp_banking_hard (
    question_text text primary key, subject_id uuid not null, explanation text not null,
    o0 text not null, o1 text not null, o2 text not null, o3 text not null, correct_index integer not null
  ) on commit drop;

  insert into tmp_banking_hard values
  ('A sum of Rs. 10,000 is invested at 10% per annum compound interest, compounded annually. What is the compound interest earned in 2 years?',quant_id,'CI = 10,000[(1.10)^2 - 1] = Rs. 2,100.','Rs. 2,000','Rs. 2,100','Rs. 2,200','Rs. 2,400',1),
  ('A can complete a work in 12 days and B can complete it in 18 days. If they work together at their respective rates, in how many days will the work be completed?',quant_id,'Combined rate = 1/12 + 1/18 = 5/36, so time = 36/5 = 7.2 days.','6 days','7.2 days','8 days','9 days',1),
  ('A 20-litre solution contains 30% water. How many litres of a 50% water solution must be added to make the final mixture 40% water?',quant_id,'Initial water = 6 L. Let x be added; 6 + 0.5x = 0.4(20+x), giving x = 20 L.','10 L','15 L','20 L','25 L',2),
  ('A train 180 metres long is travelling at 54 km/h. How long will it take to pass a pole?',quant_id,'54 km/h = 15 m/s. Time = 180/15 = 12 seconds.','10 seconds','12 seconds','14 seconds','16 seconds',1),
  ('An article is sold for Rs. 2,000 after a discount of 20% on its marked price. If the seller makes a 25% profit, what is the cost price?',quant_id,'Marked price = 2,500. Selling price 2,000 is 125% of cost price, so CP = Rs. 1,600.','Rs. 1,500','Rs. 1,600','Rs. 1,700','Rs. 1,800',1),
  ('Two fair dice are thrown together. What is the probability that the sum of the numbers obtained is 9?',quant_id,'Four outcomes give a sum of 9 out of 36, so probability = 1/9.','1/12','1/9','1/8','5/36',1),
  ('A and B invest Rs. 50,000 and Rs. 80,000 respectively in a business. A invests for 8 months and B for 5 months. What is their profit-sharing ratio?',quant_id,'Profit ratio = 50,000×8 : 80,000×5 = 1:1.','4:5','5:4','1:1','8:5',2),
  ('Three pipes can fill a tank individually in 15, 20 and 30 minutes. If all three are opened together, how long will the tank take to fill?',quant_id,'Combined rate = 1/15 + 1/20 + 1/30 = 1/8 tank per minute, so time = 8 minutes.','6 minutes','7.5 minutes','8 minutes','9 minutes',2),
  ('If x + y = 14 and xy = 45, what is the value of x² + y²?',quant_id,'x²+y² = (x+y)² - 2xy = 196 - 90 = 106.','96','104','106','110',2),
  ('The average of 8 numbers is 24. If one of the numbers, 30, is removed, what is the new average?',quant_id,'Total = 192. After removing 30, total = 162; new average = 162/7 ≈ 23.14.','22.5','23','23.14','24.5',2),
  ('In a row, P is 9th from the left and Q is 12th from the right. If P is 7 places to the left of Q, how many persons are there in the row?',reasoning_id,'Q is 16th from the left. Total = 16 + 12 - 1 = 27.','26','27','28','29',1),
  ('If all managers are leaders and some leaders are analysts, which conclusion is definitely true?',reasoning_id,'The statement that some leaders are analysts directly establishes that some analysts are leaders.','Some managers are analysts','Some analysts are leaders','All analysts are managers','No analyst is a manager',1),
  ('Find the next number in the series: 3, 8, 15, 24, 35, ?',reasoning_id,'Differences are 5, 7, 9, 11, so the next difference is 13; 35+13 = 48.','46','47','48','49',2),
  ('A person walks 8 km north, turns right and walks 6 km, then turns right and walks 8 km. How far and in which direction is the person from the starting point?',reasoning_id,'The north and south movements cancel. The person is 6 km east of the start.','6 km west','6 km east','8 km east','14 km east',1),
  ('Pointing to a woman, Ravi says, ''She is the daughter of the only son of my mother.'' How is the woman related to Ravi?',reasoning_id,'The only son of Ravi''s mother is Ravi himself, so the woman is Ravi''s daughter.','Sister','Mother','Daughter','Niece',2),
  ('In a code, each vowel is replaced by the next vowel in the sequence A-E-I-O-U-A and each consonant by the next consonant in the English alphabet. How is ''BANK'' coded?',reasoning_id,'B→C, A→E, N→O, K→L, giving CEOL.','CEOL','CBOL','BEOL','CEPK',0),
  ('Five persons P, Q, R, S and T sit in a row. P is immediately left of Q. R is at one end. S is immediately right of T. If R is not next to Q, which arrangement is possible?',reasoning_id,'T-S must be adjacent and P-Q adjacent. P-Q-T-S-R satisfies all conditions.','R-P-Q-T-S','P-Q-T-S-R','T-S-R-P-Q','P-T-S-Q-R',1),
  ('If the statements A > B, B = C, C > D and D ≥ E are true, which relation must be true?',reasoning_id,'A > B = C > D ≥ E, therefore A > E.','A < E','A = E','A > E','A ≥ B is false',2),
  ('A bank clerk processes 18 forms in 24 minutes at a constant rate. At the same rate, how many forms can be processed in 1 hour 20 minutes?',quant_id,'Rate = 18/24 = 0.75 form per minute. In 80 minutes, 60 forms are processed.','54','60','64','72',1);

  for r in select * from tmp_banking_hard loop
    if not exists(select 1 from public.questions q where q.exam_stage_id=stage_id and q.language='en' and q.normalized_text=public.question_normalize(r.question_text)) then
      insert into public.questions(exam_stage_id,subject_id,language,question_text,explanation,difficulty,status,source_type,validation_status,auto_decision,review_required,approved_at)
      values(stage_id,r.subject_id,'en',r.question_text,r.explanation,'hard','approved','original','passed','approved',false,now());
    end if;
  end loop;

  insert into public.question_options(question_id,option_index,option_text,is_correct)
  select q.id,x.idx,x.txt,x.idx=h.correct_index
  from tmp_banking_hard h
  join public.questions q on q.exam_stage_id=stage_id and q.language='en' and q.normalized_text=public.question_normalize(h.question_text)
  cross join lateral(values(0,h.o0),(1,h.o1),(2,h.o2),(3,h.o3)) x(idx,txt)
  on conflict do nothing;
end $$;
