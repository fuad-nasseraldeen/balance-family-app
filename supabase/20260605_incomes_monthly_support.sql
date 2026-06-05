-- Safe enhancement for income tracking and monthly notes
alter table public.incomes
  add column if not exists note text,
  add column if not exists source text not null default 'משכורת',
  add column if not exists income_date date,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists subcategory text;

update public.incomes
set income_date = coalesce(income_date, deposit_date),
    source = coalesce(source, 'משכורת')
where income_date is null or source is null;

create index if not exists incomes_household_income_date_idx
  on public.incomes (household_id, income_date desc);
