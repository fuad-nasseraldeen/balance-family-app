-- Seed missing shared expense categories. Categories are not assigned to one person;
-- the payer is selected per expense.
with household_row as (
  select id from public.households limit 1
)
alter table public.categories
  add column if not exists parent_name text;

insert into public.categories (household_id, name, parent_name, owner, monthly_target, is_automatic)
select hr.id, v.name, v.parent_name, v.owner, v.monthly_target, false
from household_row hr
cross join (values
  ('סופר', 'מזון וקניות לבית', 'fuad', 0),
  ('בשר', 'מזון וקניות לבית', 'fuad', 0),
  ('ירקות', 'מזון וקניות לבית', 'fuad', 0),
  ('פירות', 'מזון וקניות לבית', 'fuad', 0),
  ('חשמל, מים, ארנונה', 'בית וחשבונות', 'fuad', 0),
  ('בנק', 'בית וחשבונות', 'fuad', 0),
  ('הלוואה בבנק בינלאומי', 'בית וחשבונות', 'fuad', 0),
  ('דלקן', 'בית וחשבונות', 'fuad', 0),
  ('גנים', 'ילדים וחינוך', 'fuad', 0),
  ('גן אדם', 'ילדים וחינוך', 'fuad', 0),
  ('גן חוגים', 'ילדים וחינוך', 'fuad', 0),
  ('טיפולים חוגים', 'ילדים וחינוך', 'fuad', 0),
  ('דלק', 'רכב ותחבורה', 'fuad', 0),
  ('דלק - רכב חיסן', 'רכב ותחבורה', 'fuad', 0),
  ('חניה', 'רכב ותחבורה', 'fuad', 0),
  ('קופת חולים', 'בריאות וטיפוח', 'fuad', 0),
  ('טיפוח (שיער, פנים)', 'בריאות וטיפוח', 'fuad', 0),
  ('תרופות', 'בריאות וטיפוח', 'fuad', 0),
  ('מסעדות', 'בילויים ואוכל בחוץ', 'fuad', 0),
  ('בתי קפה', 'בילויים ואוכל בחוץ', 'fuad', 0),
  ('בילויים', 'בילויים ואוכל בחוץ', 'fuad', 0),
  ('הלבשה', 'קניות והלבשה', 'fuad', 0),
  ('נעליים', 'קניות והלבשה', 'fuad', 0),
  ('ביטוח לאומי', 'התחייבויות וחובות', 'fuad', 0),
  ('הלוואות', 'התחייבויות וחובות', 'fuad', 0),
  ('חיסכון', 'חסכונות השקעות ותרומות', 'fuad', 0),
  ('השקעות', 'חסכונות השקעות ותרומות', 'fuad', 0),
  ('תרומות', 'חסכונות השקעות ותרומות', 'fuad', 0),
  ('טלפון', 'מנויים ושירותים דיגיטליים', 'fuad', 0),
  ('אינטרנט', 'מנויים ושירותים דיגיטליים', 'fuad', 0),
  ('סטרימינג', 'מנויים ושירותים דיגיטליים', 'fuad', 0),
  ('אירועים', 'הוצאות לא חודשיות', 'fuad', 0),
  ('תיקונים', 'הוצאות לא חודשיות', 'fuad', 0),
  ('רכישה חד פעמית', 'הוצאות לא חודשיות', 'fuad', 0)
) as v(name, parent_name, owner, monthly_target)
where not exists (
  select 1
  from public.categories c
  where c.household_id = hr.id
    and c.name = v.name
    and coalesce(c.parent_name, v.parent_name) = v.parent_name
);
