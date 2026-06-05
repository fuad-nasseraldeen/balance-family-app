-- Destructive category reset for the current household.
-- This deletes all category rows and rebuilds a clean subcategory list.
-- Existing expenses are kept, but their category_id becomes null because
-- expenses.category_id uses "on delete set null".

begin;

alter table public.categories
  add column if not exists parent_name text;

delete from public.categories
where household_id = '1432b272-31f1-4078-ac2a-3940a4d1ca8b';

insert into public.categories (household_id, parent_name, name, owner, monthly_target, is_automatic)
values
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'מזון וקניות לבית', 'סופר', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'מזון וקניות לבית', 'בשר', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'מזון וקניות לבית', 'ירקות ופירות', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'מזון וקניות לבית', 'אוכל בחוץ', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'בית וחשבונות', 'חשמל מים וארנונה', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'בית וחשבונות', 'ועד בית', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'בית וחשבונות', 'תחזוקת בית', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'ילדים וחינוך', 'גנים', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'ילדים וחינוך', 'ציוד לילדים', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'רכב ותחבורה', 'דלק', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'רכב ותחבורה', 'טיפולים לרכב', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'רכב ותחבורה', 'ביטוח רכב', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'רכב ותחבורה', 'תחבורה ציבורית וחניה', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'בריאות וטיפוח', 'קופת חולים', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'בריאות וטיפוח', 'תרופות', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'בריאות וטיפוח', 'טיפוח', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'קניות והלבשה', 'ביגוד', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'קניות והלבשה', 'נעליים', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'קניות והלבשה', 'מוצרים לבית', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'מנויים ושירותים דיגיטליים', 'טלפון', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'מנויים ושירותים דיגיטליים', 'אינטרנט', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'מנויים ושירותים דיגיטליים', 'סטרימינג', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'מנויים ושירותים דיגיטליים', 'תוכנות', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'התחייבויות וחובות', 'ביטוח לאומי', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'התחייבויות וחובות', 'הלוואות', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'התחייבויות וחובות', 'כרטיסי אשראי', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'חסכונות השקעות ותרומות', 'חיסכון', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'חסכונות השקעות ותרומות', 'השקעות', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'חסכונות השקעות ותרומות', 'תרומות', 'fuad', 0, false),

  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'הוצאות לא חודשיות', 'אירועים', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'הוצאות לא חודשיות', 'תיקונים', 'fuad', 0, false),
  ('1432b272-31f1-4078-ac2a-3940a4d1ca8b', 'הוצאות לא חודשיות', 'רכישה חד פעמית', 'fuad', 0, false);

commit;

select parent_name, name, monthly_target
from public.categories
where household_id = '1432b272-31f1-4078-ac2a-3940a4d1ca8b'
order by parent_name, name;
