-- Match the current app setup: this project uses the shared anon client and
-- household_id filtering in the app, so RLS is disabled like the other tables.

alter table public.cancellations disable row level security;

grant select, insert, update, delete on public.cancellations to anon;
grant select, insert, update, delete on public.cancellations to authenticated;
