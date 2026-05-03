create extension if not exists pgcrypto;

create table if not exists households (
  id uuid primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  owner text not null check (owner in ('fuad', 'hisan')),
  monthly_target numeric not null default 0,
  is_automatic boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  owner text not null check (owner in ('fuad', 'hisan')),
  paid_by text not null check (paid_by in ('fuad', 'hisan')),
  amount numeric not null check (amount >= 0),
  note text,
  expense_date date not null,
  is_automatic boolean not null default false,
  automatic_month text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists monthly_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month text not null,
  total_budget numeric not null default 0,
  total_expenses numeric not null default 0,
  by_owner jsonb not null default '{}'::jsonb,
  by_category jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create unique index if not exists expenses_auto_unique_idx
  on expenses(household_id, category_id, automatic_month, is_automatic);

alter table households disable row level security;
alter table categories disable row level security;
alter table expenses disable row level security;
alter table monthly_history disable row level security;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
before update on categories
for each row execute procedure set_updated_at();

drop trigger if exists trg_expenses_updated_at on expenses;
create trigger trg_expenses_updated_at
before update on expenses
for each row execute procedure set_updated_at();
