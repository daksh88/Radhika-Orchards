-- Run this once in Supabase SQL Editor after creating the admin user.
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
