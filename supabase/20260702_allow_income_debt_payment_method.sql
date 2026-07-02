do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.incomes'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%payment_method%';

  if constraint_name is not null then
    execute format('alter table public.incomes drop constraint %I', constraint_name);
  end if;

  alter table public.incomes
    add constraint incomes_payment_method_check
    check (payment_method in ('cash', 'bank_transfer', 'debt'));
end $$;
