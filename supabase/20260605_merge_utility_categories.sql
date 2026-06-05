-- Merge separate utility subcategories into one clean subcategory:
-- בית וחשבונות -> חשמל מים וארנונה

begin;

alter table public.categories
  add column if not exists parent_name text;

with target_category as (
  insert into public.categories (household_id, parent_name, name, owner, monthly_target, is_automatic)
  select
    '1432b272-31f1-4078-ac2a-3940a4d1ca8b',
    'בית וחשבונות',
    'חשמל מים וארנונה',
    'fuad',
    coalesce(sum(monthly_target), 0),
    false
  from public.categories
  where household_id = '1432b272-31f1-4078-ac2a-3940a4d1ca8b'
    and parent_name = 'בית וחשבונות'
    and name in ('חשמל', 'מים', 'ארנונה', 'חשמל, מים, ארנונה', 'חשמל,מים,ארנונה')
  on conflict do nothing
  returning id
),
existing_target as (
  select id
  from public.categories
  where household_id = '1432b272-31f1-4078-ac2a-3940a4d1ca8b'
    and parent_name = 'בית וחשבונות'
    and name = 'חשמל מים וארנונה'
  limit 1
),
chosen_target as (
  select id from target_category
  union all
  select id from existing_target
  limit 1
),
old_categories as (
  select id
  from public.categories
  where household_id = '1432b272-31f1-4078-ac2a-3940a4d1ca8b'
    and parent_name = 'בית וחשבונות'
    and name in ('חשמל', 'מים', 'ארנונה', 'חשמל, מים, ארנונה', 'חשמל,מים,ארנונה')
)
update public.expenses
set category_id = (select id from chosen_target)
where household_id = '1432b272-31f1-4078-ac2a-3940a4d1ca8b'
  and category_id in (select id from old_categories);

delete from public.categories
where household_id = '1432b272-31f1-4078-ac2a-3940a4d1ca8b'
  and parent_name = 'בית וחשבונות'
  and name in ('חשמל', 'מים', 'ארנונה', 'חשמל, מים, ארנונה', 'חשמל,מים,ארנונה');

commit;
