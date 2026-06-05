-- Normalize Hesen's DB key and add cancellations as a separate monthly metric.

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where contype = 'c'
      and conrelid in ('public.categories'::regclass, 'public.expenses'::regclass, 'public.incomes'::regclass)
      and pg_get_constraintdef(oid) like '%hisan%'
  loop
    execute format('alter table %s drop constraint %I', constraint_row.table_name, constraint_row.conname);
  end loop;
end $$;

update public.categories set owner = 'hesen' where owner = 'hisan';
update public.expenses set owner = 'hesen' where owner = 'hisan';
update public.expenses set paid_by = 'hesen' where paid_by = 'hisan';
update public.incomes set owner = 'hesen' where owner = 'hisan';

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.categories'::regclass and conname = 'categories_owner_check') then
    alter table public.categories add constraint categories_owner_check check (owner in ('fuad', 'hesen'));
  end if;

  if not exists (select 1 from pg_constraint where conrelid = 'public.expenses'::regclass and conname = 'expenses_owner_check') then
    alter table public.expenses add constraint expenses_owner_check check (owner in ('fuad', 'hesen'));
  end if;

  if not exists (select 1 from pg_constraint where conrelid = 'public.expenses'::regclass and conname = 'expenses_paid_by_check') then
    alter table public.expenses add constraint expenses_paid_by_check check (paid_by in ('fuad', 'hesen'));
  end if;

  if not exists (select 1 from pg_constraint where conrelid = 'public.incomes'::regclass and conname = 'incomes_owner_check') then
    alter table public.incomes add constraint incomes_owner_check check (owner in ('fuad', 'hesen'));
  end if;
end $$;

create table if not exists public.cancellations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner text not null check (owner in ('fuad', 'hesen')),
  amount numeric not null check (amount >= 0),
  client_name text,
  note text,
  cancellation_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists cancellations_household_date_idx
  on public.cancellations (household_id, cancellation_date desc);

alter table public.cancellations disable row level security;

drop trigger if exists trg_cancellations_updated_at on public.cancellations;
create trigger trg_cancellations_updated_at
before update on public.cancellations
for each row execute procedure public.set_updated_at();
