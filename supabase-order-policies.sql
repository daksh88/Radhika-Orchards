-- Run this once in Supabase SQL Editor.
-- These policies allow the public checkout to create orders,
-- while keeping order reads and updates restricted to signed-in admins.

drop policy if exists "Public can create orders" on public.orders;
drop policy if exists "Public can create order items" on public.order_items;

create policy "Public can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

create policy "Public can create order items"
on public.order_items
for insert
to anon, authenticated
with check (true);

drop policy if exists "Signed-in admins can view orders" on public.orders;
drop policy if exists "Signed-in admins can update orders" on public.orders;
drop policy if exists "Signed-in admins can view order items" on public.order_items;

create policy "Signed-in admins can view orders"
on public.orders
for select
to authenticated
using (true);

create policy "Signed-in admins can update orders"
on public.orders
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Signed-in admins can delete orders" on public.orders;
drop policy if exists "Signed-in admins can delete order items" on public.order_items;

create policy "Signed-in admins can delete orders"
on public.orders
for delete
to authenticated
using (true);

create policy "Signed-in admins can delete order items"
on public.order_items
for delete
to authenticated
using (true);

create policy "Signed-in admins can view order items"
on public.order_items
for select
to authenticated
using (true);

create or replace function public.get_order_status(p_order_numbers text[])
returns table(order_number text, order_status text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select o.order_number, o.order_status, o.created_at
  from public.orders o
  where o.order_number = any(p_order_numbers)
  limit 20;
$$;

revoke all on function public.get_order_status(text[]) from public;
grant execute on function public.get_order_status(text[]) to anon, authenticated;
