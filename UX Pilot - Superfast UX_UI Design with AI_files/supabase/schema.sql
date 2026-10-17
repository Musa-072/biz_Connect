create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'business_owner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  location text,
  description text,
  website text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  price numeric(10,2) not null default 0,
  currency text not null default 'ZAR',
  stock integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references public.profiles(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  total numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_businesses_owner_id on public.businesses(owner_id);
create index if not exists idx_products_business_id on public.products(business_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_orders_buyer_id on public.orders(buyer_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'role' = 'business_owner' then 'business_owner' else 'customer' end
  )
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_businesses_updated_at on public.businesses;
create trigger trg_businesses_updated_at
before update on public.businesses
for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute procedure public.handle_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Profiles are viewable by owner or admin" on public.profiles;
create policy "Profiles are viewable by owner or admin"
on public.profiles
for select
using (auth.uid() = id or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

drop policy if exists "Businesses are viewable by everyone" on public.businesses;
create policy "Businesses are viewable by everyone"
on public.businesses
for select
using (true);

drop policy if exists "Business owners can manage their businesses" on public.businesses;
create policy "Business owners can manage their businesses"
on public.businesses
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
on public.products
for select
using (true);

drop policy if exists "Business owners can manage their products" on public.products;
create policy "Business owners can manage their products"
on public.products
for all
using (
  business_id in (
    select id from public.businesses where owner_id = auth.uid()
  )
)
with check (
  business_id in (
    select id from public.businesses where owner_id = auth.uid()
  )
);

drop policy if exists "Orders are visible to buyer and business owner" on public.orders;
create policy "Orders are visible to buyer and business owner"
on public.orders
for select
using (
  buyer_id = auth.uid() or business_id in (
    select id from public.businesses where owner_id = auth.uid()
  )
);

drop policy if exists "Buyers can create their own orders" on public.orders;
create policy "Buyers can create their own orders"
on public.orders
for insert
with check (buyer_id = auth.uid());

drop policy if exists "Business owners can update order statuses" on public.orders;
create policy "Business owners can update order statuses"
on public.orders
for update
using (
  business_id in (
    select id from public.businesses where owner_id = auth.uid()
  )
);

  drop policy if exists "Order items are visible to order participants" on public.order_items;
  create policy "Order items are visible to order participants"
  on public.order_items
  for select
  using (
    order_id in (
      select id from public.orders where buyer_id = auth.uid() or business_id in (
        select id from public.businesses where owner_id = auth.uid()
      )
    )
  );

  drop policy if exists "Buyers can add items to their orders" on public.order_items;
  create policy "Buyers can add items to their orders"
  on public.order_items
  for insert
  with check (
    order_id in (select id from public.orders where buyer_id = auth.uid())
  );
