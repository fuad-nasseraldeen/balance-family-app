-- Match the current app setup: this project uses the shared anon client and
-- household_id filtering in the app, so incomes should not rely on RLS.

alter table public.incomes disable row level security;

grant select, insert, update, delete on public.incomes to anon;
grant select, insert, update, delete on public.incomes to authenticated;
