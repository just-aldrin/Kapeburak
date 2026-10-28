create table public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('Coffee', 'Pastry', 'Bottled', 'Pantry', 'Goods')),
  description text not null,
  note text not null,
  price_centavos integer not null check (price_centavos >= 0),
  options text[] not null default '{}',
  image_path text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.order_number_seq start with 1000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('KB-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_email text not null check (char_length(customer_email) <= 254),
  customer_phone text not null check (char_length(customer_phone) between 7 and 24),
  fulfillment text not null check (fulfillment in ('Pickup', 'Delivery')),
  delivery_address text,
  order_note text check (order_note is null or char_length(order_note) <= 500),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_provider text not null default 'none' check (payment_provider in ('none', 'paymongo')),
  subtotal_centavos integer not null check (subtotal_centavos >= 0),
  delivery_fee_centavos integer not null check (delivery_fee_centavos >= 0),
  total_centavos integer not null check (total_centavos = subtotal_centavos + delivery_fee_centavos),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_address_required check (
    (fulfillment = 'Pickup' and delivery_address is null)
    or (fulfillment = 'Delivery' and delivery_address is not null and char_length(delivery_address) between 5 and 400)
  )
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  selected_option text,
  quantity integer not null check (quantity between 1 and 20),
  unit_price_centavos integer not null check (unit_price_centavos >= 0),
  line_total_centavos integer not null check (line_total_centavos = unit_price_centavos * quantity),
  created_at timestamptz not null default now()
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index order_items_order_id_idx on public.order_items (order_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.products to anon, authenticated;
create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (active);

revoke all on public.orders, public.order_items from anon, authenticated;
revoke all on sequence public.order_number_seq from anon, authenticated;
grant usage, select on sequence public.order_number_seq to service_role;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

create policy "Public can view product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

insert into public.products (
  id, name, category, description, note, price_centavos, options, featured, sort_order
) values
  ('spanish-latte', 'Kapeburak Spanish Latte', 'Coffee', 'Two ristretto shots, sweet condensed milk, chilled velvety fresh milk, and cinnamon.', 'Our signature pour', 18500, array['Iced', 'Hot'], true, 1),
  ('tultul-latte', 'Guimaras Tultul Latte', 'Coffee', 'Velvety latte layered with artisanal Guimaras tultul heirloom sea salt.', 'Sweet + savory', 19500, array['Iced', 'Hot'], false, 2),
  ('liberica-cloud', 'Batangas Liberica Cloud', 'Coffee', 'Heritage Liberica espresso floated above aerated vanilla bean cloud foam.', 'Bold + floral', 20500, array['Iced', 'Hot'], false, 3),
  ('ube-cruffin', 'Bohol Ube Cruffin', 'Pastry', '27-layer laminated French butter pastry with ube halaya and three-milk cream.', 'Baked this morning', 16500, array[]::text[], false, 4),
  ('cold-steep', '18H Cold Steep', 'Bottled', 'A slow-steeped cafe-grade brew with dark caramel and cacao notes.', 'Keep chilled', 21000, array['250ml', '500ml'], false, 5),
  ('atok-honey', 'Atok Honeydark Beans', 'Pantry', 'Freshly roasted Benguet beans with wild honey sweetness and a dark chocolate finish.', '250g · whole bean', 42000, array['Whole bean', 'Ground'], false, 6),
  ('field-notes-tumbler', 'Field Notes Tumbler', 'Goods', 'A double-wall thermal tumbler for slow mornings, long drives, and everything between.', '12oz · matte clay', 78000, array[]::text[], false, 7),
  ('panaderia-toast', 'Panaderia Morning Toast', 'Pastry', 'Griddled brioche, cultured butter, muscovado sugar, and a pinch of sea salt.', 'Best with espresso', 14500, array[]::text[], false, 8)
on conflict (id) do nothing;

create or replace function public.create_store_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_fulfillment text,
  p_delivery_address text,
  p_order_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_delivery_fee integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id text;
  v_option text;
  v_quantity integer;
begin
  if p_customer_name is null or char_length(trim(p_customer_name)) not between 2 and 120 then
    raise exception 'Enter a name between 2 and 120 characters';
  end if;
  if p_customer_email is null or char_length(trim(p_customer_email)) > 254
    or trim(p_customer_email) !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Enter a valid email address';
  end if;
  if p_customer_phone is null or char_length(trim(p_customer_phone)) not between 7 and 24 then
    raise exception 'Enter a valid phone number';
  end if;
  if p_fulfillment is null or p_fulfillment not in ('Pickup', 'Delivery') then
    raise exception 'Choose pickup or delivery';
  end if;
  if p_fulfillment = 'Delivery' and (
    p_delivery_address is null
    or char_length(trim(p_delivery_address)) not between 5 and 400
  ) then
    raise exception 'A valid delivery address is required';
  end if;
  if p_order_note is not null and char_length(p_order_note) > 500 then
    raise exception 'Order note is too long';
  end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'An order must contain between 1 and 20 item lines';
  end if;
  if jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'An order must contain between 1 and 20 item lines';
  end if;

  if p_fulfillment = 'Delivery' then
    v_delivery_fee := 8000;
  end if;

  insert into public.orders (
    customer_name, customer_email, customer_phone, fulfillment, delivery_address,
    order_note, subtotal_centavos, delivery_fee_centavos, total_centavos
  ) values (
    trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone),
    p_fulfillment,
    case when p_fulfillment = 'Delivery' then trim(p_delivery_address) else null end,
    nullif(trim(coalesce(p_order_note, '')), ''),
    0, v_delivery_fee, v_delivery_fee
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
      or coalesce(v_item->>'productId', '') = ''
      or coalesce(v_item->>'quantity', '') !~ '^[0-9]{1,2}$' then
      raise exception 'An order item is invalid';
    end if;

    v_product_id := v_item->>'productId';
    v_quantity := (v_item->>'quantity')::integer;
    v_option := nullif(v_item->>'option', '');
    if v_quantity not between 1 and 20 then
      raise exception 'Item quantity must be between 1 and 20';
    end if;

    select * into v_product
    from public.products
    where id = v_product_id and active;
    if not found then
      raise exception 'A selected product is no longer available';
    end if;
    if (cardinality(v_product.options) = 0 and v_option is not null)
      or (cardinality(v_product.options) > 0 and (v_option is null or not (v_option = any(v_product.options)))) then
      raise exception 'A selected product option is invalid';
    end if;

    v_subtotal := v_subtotal + v_product.price_centavos * v_quantity;
    insert into public.order_items (
      order_id, product_id, product_name, selected_option, quantity,
      unit_price_centavos, line_total_centavos
    ) values (
      v_order_id, v_product.id, v_product.name, v_option, v_quantity,
      v_product.price_centavos, v_product.price_centavos * v_quantity
    );
  end loop;

  update public.orders
  set subtotal_centavos = v_subtotal,
      total_centavos = v_subtotal + v_delivery_fee
  where id = v_order_id;

  return jsonb_build_object(
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'subtotalCentavos', v_subtotal,
    'deliveryFeeCentavos', v_delivery_fee,
    'totalCentavos', v_subtotal + v_delivery_fee
  );
end;
$$;

revoke all on function public.create_store_order(text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_store_order(text, text, text, text, text, text, jsonb) to service_role;
