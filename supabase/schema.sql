-- ==========================================================
-- MIXTAS FASHION STORE - COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA
-- ==========================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Trigger to create profile automatically on auth sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper function for Admin check
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 3. CATEGORIES TABLE
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- 4. PRODUCTS TABLE
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5,
  category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. PRODUCT IMAGES TABLE
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text not null,
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. ORDERS TABLE
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  user_id uuid references public.profiles(id) on delete set null,
  idempotency_key text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded')),
  total integer not null check (total >= 0),
  currency text not null default 'XAF',
  customer_name text,
  customer_phone text,
  customer_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists orders_user_idempotency_uniq
  on public.orders(user_id, idempotency_key)
  where idempotency_key is not null;

-- 7. ORDER ITEMS TABLE
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

-- 8. PAYMENTS TABLE
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  provider text not null,
  provider_reference text unique,
  checkout_url text,
  amount integer not null check (amount >= 0),
  currency text not null default 'XAF',
  status text not null default 'pending'
    check (status in ('pending', 'successful', 'failed', 'refunded', 'needs_refund')),
  payer_phone text,
  payer_name text,
  raw_payload jsonb,
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

alter table public.payments add column if not exists checkout_url text;
alter table public.payments add column if not exists note text;

create unique index if not exists payments_one_open_per_order
  on public.payments(order_id)
  where order_id is not null and status in ('pending', 'successful');

-- 9. ADMIN AUDIT LOG TABLE
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- 10. STORAGE BUCKETS SETUP
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 11. ROW LEVEL SECURITY (RLS)
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.payments       enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "categories_public_read" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read" on public.products for select using (is_active = true or public.is_admin());
create policy "products_admin_write" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "product_images_public_read" on public.product_images for select using (true);
create policy "product_images_admin_write" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

create policy "orders_select_own_or_admin" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_insert_own" on public.orders for insert with check (user_id = auth.uid());
create policy "orders_admin_update" on public.orders for update using (public.is_admin());

create policy "payments_select_own_or_admin" on public.payments for select using (user_id = auth.uid() or public.is_admin());
create policy "payments_insert_own" on public.payments for insert with check (user_id = auth.uid() or user_id is null);
create policy "payments_admin_update" on public.payments for update using (public.is_admin());

create policy "audit_admin_read" on public.admin_audit_log for select using (public.is_admin());

create policy "storage_public_read" on storage.objects for select using (bucket_id = 'product-images');
create policy "storage_admin_write" on storage.objects for all using (bucket_id = 'product-images' and public.is_admin());
