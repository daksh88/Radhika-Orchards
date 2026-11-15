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

create policy "Signed-in admins can view order items"
on public.order_items
for select
to authenticated
using (true);
