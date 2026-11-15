-- Run this once in Supabase SQL Editor.
-- The checkout calls this controlled function instead of directly writing
-- to the protected orders tables.

create or replace function public.create_order(
  order_data jsonb,
  item_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  created_order public.orders;
  item jsonb;
begin
  if coalesce(order_data->>'customer_name', '') = ''
     or coalesce(order_data->>'phone', '') = ''
     or coalesce(order_data->>'address', '') = ''
     or coalesce(order_data->>'city', '') = ''
     or coalesce(order_data->>'pincode', '') = '' then
    raise exception 'Missing required customer details';
  end if;

  if jsonb_typeof(item_data) <> 'array' or jsonb_array_length(item_data) = 0 then
    raise exception 'At least one order item is required';
  end if;

  insert into public.orders (
    order_number, customer_name, phone, email, address, city, pincode,
    maps_link, latitude, longitude, payment_method, payment_status,
    order_status, subtotal, delivery_fee, total_amount
  )
  values (
    order_data->>'order_number',
    order_data->>'customer_name',
    order_data->>'phone',
    nullif(order_data->>'email', ''),
    order_data->>'address',
    order_data->>'city',
    order_data->>'pincode',
    nullif(order_data->>'maps_link', ''),
    nullif(order_data->>'latitude', '')::double precision,
    nullif(order_data->>'longitude', '')::double precision,
    'cash_on_delivery',
    'pending',
    'new',
    (order_data->>'subtotal')::integer,
    0,
    (order_data->>'total_amount')::integer
  )
  returning * into created_order;

  for item in select * from jsonb_array_elements(item_data)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, unit_price, quantity, line_total
    )
    values (
      created_order.id,
      (item->>'product_id')::bigint,
      item->>'product_name',
      (item->>'unit_price')::integer,
      (item->>'quantity')::integer,
      (item->>'line_total')::integer
    );
  end loop;

  return jsonb_build_object(
    'id', created_order.id,
    'order_id', created_order.order_number
  );
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public;
grant execute on function public.create_order(jsonb, jsonb) to anon, authenticated;
