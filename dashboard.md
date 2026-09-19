# Admin Dashboard Spec (Phase 1)

> **How to use this file:** Drop it in the root of the existing shop project (or paste it into V0 / Cursor / Claude Code / OpenCode) and say:
> *"Read ADMIN_DASHBOARD_SPEC.md and implement it step by step, in the order of the Build Order section. Reuse the existing design system."*

---

## 0. Goal

Add an `/admin` dashboard to the **existing** e-commerce shop. The admin must be able to:

1. **Manage products**: add / edit / delete, with images, description, price, category, stock.
2. **Monitor payments**: see every money transfer, its status, who paid, for which order.
3. **See all user accounts**: every authenticated user, their profile, and their orders.
4. **See orders** and change their status (no shipping/tracking for now).

### Explicitly OUT of scope (do not build)

- Shipping labels, delivery tracking, tracking numbers, logistics
- Coupons, CMS/blog, SEO tools, loyalty
- Multi-staff roles (only `customer` and `admin` for now)
- Automated backups, fraud detection

---

## 1. Design rule (most important)

The dashboard must look like it belongs to the same website. **Do not invent a new style.**

Before writing any UI code, the agent must:

1. Read `app/globals.css` (or `styles/globals.css`) and `tailwind.config.*` to get the existing colors, radius, fonts, and CSS variables.
2. Read the existing `components/ui/*` (shadcn/ui) and reuse them: `Button`, `Input`, `Card`, `Table`, `Dialog`, `Sheet`, `Select`, `Badge`, `Tabs`, `DropdownMenu`, `Textarea`, `Skeleton`, `Sonner/Toast`.
3. Reuse the same fonts, spacing, border radius, and button styles as the storefront.
4. Support the same light/dark mode behavior the storefront already has.
5. Only use the existing color tokens (`bg-background`, `text-foreground`, `bg-primary`, `bg-muted`, `border`, etc.). No hard-coded hex colors.

If a component you need does not exist, add it with the same shadcn/ui style, not a different library.

---

## 2. Tech assumptions

The shop was generated with V0, so assume:

- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**
- **Supabase** for Auth + Postgres + Storage (if the project already uses something else for auth/DB, keep that and adapt Section 4 to it instead of adding a second system)
- **Package manager: pnpm**
- Currency: **XAF** (no decimals, so prices are stored as integers). If you use USD, store cents instead.

Install (only what is missing):

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers date-fns recharts
```

Environment variables (`.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server only, NEVER prefix with NEXT_PUBLIC
PAYMENT_WEBHOOK_SECRET=your_webhook_secret        # from your payment provider
```

---

## 3. Routes

```
/admin                     Overview (stats + recent orders + recent payments)
/admin/products            Product table (search, filter, pagination)
/admin/products/new        Create product
/admin/products/[id]       Edit product
/admin/categories          Manage categories
/admin/orders              Orders table
/admin/orders/[id]         Order detail + status change
/admin/payments            Payments monitor (all money transfers)
/admin/payments/[id]       Payment detail
/admin/users               All user accounts
/admin/users/[id]          User detail (profile + their orders + their payments)
/api/webhooks/payment      Payment provider webhook (server-only)
```

Layout: left sidebar (collapses to a `Sheet` on mobile) with links to the pages above, top bar with the admin's name and a logout button. Use the same header/brand logo as the storefront.

---

## 4. Database (run this in the Supabase SQL editor)

Complete script. Run it once.

```sql
-- ============ EXTENSIONS ============
create extension if not exists "pgcrypto";

-- ============ PROFILES (one row per authenticated user) ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that already exist
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ============ ADMIN CHECK HELPER ============
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============ CATEGORIES ============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ============ PRODUCTS ============
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price integer not null check (price >= 0),          -- XAF, no decimals
  compare_at_price integer check (compare_at_price >= 0), -- optional "old price"
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5,
  category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============ PRODUCT IMAGES ============
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text not null,
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images(product_id);

-- ============ ORDERS ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  user_id uuid references public.profiles(id) on delete set null,
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

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,        -- snapshot, so history survives product edits/deletes
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

create index if not exists order_items_order_idx on public.order_items(order_id);

-- ============ PAYMENTS (money transfers) ============
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  provider text not null,                       -- e.g. 'mtn_momo', 'orange_money', 'flutterwave', 'manual'
  provider_reference text unique,               -- transaction id from the provider (prevents duplicates)
  amount integer not null check (amount >= 0),
  currency text not null default 'XAF',
  status text not null default 'pending'
    check (status in ('pending', 'successful', 'failed', 'refunded')),
  payer_phone text,
  payer_name text,
  raw_payload jsonb,                            -- full webhook body, for debugging/disputes
  confirmed_by uuid references public.profiles(id), -- set when an admin confirms manually
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments(order_id);
create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists payments_status_idx on public.payments(status);

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.payments       enable row level security;

-- profiles: users read/update their own row (but cannot change their role), admins read all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin());

-- categories & products & images: public read, admin write
create policy "categories_public_read" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read" on public.products
  for select using (is_active = true or public.is_admin());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_images_public_read" on public.product_images for select using (true);
create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: owner reads own, admin reads/updates all
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin());

create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- payments: owner reads own, admin reads/updates all.
-- Inserts from providers happen server-side with the service role key (bypasses RLS).
create policy "payments_select_own_or_admin" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());
create policy "payments_admin_update" on public.payments
  for update using (public.is_admin());

-- ============ STORAGE (product images) ============
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product_images_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ============ MAKE YOURSELF ADMIN (run AFTER you sign up on the site) ============
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
```

> If the shop already has tables named `products`, `orders`, etc., do NOT drop them. Compare and write a migration that adds only the missing columns/tables.

---

## 5. Security rules (non-negotiable)

1. **Admin guard on the server**, not just hidden buttons. In `app/admin/layout.tsx`, get the user server-side, load their `profiles.role`, and `redirect('/')` (or to login) if they are not `admin`. Also protect `/admin/:path*` in `middleware.ts` (check for a session; the role check stays in the layout and in every server action).
2. **Every server action / API route that mutates data must re-check `role === 'admin'`.** Never trust the client.
3. `SUPABASE_SERVICE_ROLE_KEY` is used **only** in server code (webhook route, admin server actions if needed). Never import it in a client component.
4. **Validate all input with Zod** (product form, category form, status changes).
5. **Payment webhook must verify the provider's signature/secret** before doing anything. Never mark a payment `successful` based on something the browser sends. Also confirm the amount matches the order total.
6. Image uploads: accept only `image/jpeg`, `image/png`, `image/webp`, max 5 MB each.
7. Never expose other users' emails/phones outside `/admin`.

---

## 6. Features in detail

### 6.1 Overview (`/admin`)

- Stat cards: **Total revenue** (sum of `successful` payments), **Orders today**, **Pending payments**, **Total users**, **Total products**.
- Line/bar chart (recharts): revenue for the last 30 days.
- "Recent orders" (last 5) and "Recent payments" (last 5) mini-tables with links to the detail pages.
- "Low stock" card: products where `stock <= low_stock_threshold`.

### 6.2 Products (`/admin/products`)

**Table columns:** image thumbnail, name, category, price (formatted `12 500 XAF`), stock, active toggle, actions (edit / delete).
Search by name, filter by category and active/inactive, pagination (20 per page).

**Create/Edit form fields:**

| Field | Type | Rules |
|---|---|---|
| Name | text | required, 2-120 chars |
| Slug | text | auto-generated from name, editable, unique |
| Description | textarea | optional, up to 5000 chars |
| Price | number | required, integer >= 0 |
| Compare-at price | number | optional |
| Category | select | from `categories` |
| Stock | number | integer >= 0 |
| Low-stock threshold | number | default 5 |
| Active | switch | default on |
| Images | multi-upload | drag & drop, preview, reorder, choose primary, delete |

**Image upload flow:**
1. Admin selects files, show local previews immediately.
2. Upload each to Supabase Storage bucket `product-images` at path `products/{productId}/{uuid}-{filename}`.
3. Get the public URL, insert a row in `product_images` (`url`, `storage_path`, `position`, `is_primary`).
4. First image becomes primary by default.
5. On delete of an image: remove the storage object **and** the DB row.
6. On delete of a product: remove all its storage objects first, then the product row. Ask for confirmation in a `Dialog`.

### 6.3 Categories (`/admin/categories`)

Simple table + dialog to add/rename/delete. Block deleting a category that still has products (or show a warning that they will become uncategorized).

### 6.4 Orders (`/admin/orders`)

- Table: order number, customer name, date, total, order status badge, payment status badge.
- Filters: status, date range. Search by order number or customer name.
- Detail page: items list, totals, customer info, linked payment(s), status dropdown.
- Allowed statuses: `pending`, `paid`, `processing`, `completed`, `cancelled`, `refunded`.
- When status changes to `cancelled`, offer to restock items (increase `stock` by quantity).
- **No tracking numbers, no shipping labels.**

### 6.5 Payments (`/admin/payments`) — money transfer monitoring

- Table: date, provider (MTN MoMo / Orange Money / etc.), reference, payer name/phone, amount, linked order, status badge (`pending` yellow, `successful` green, `failed` red, `refunded` gray).
- Filters: status, provider, date range. Search by reference or phone number.
- Top summary: total received (this month), pending count, failed count.
- Detail page: all fields plus the `raw_payload` JSON in a collapsible code block.
- **Manual confirmation:** for transfers the admin verified by hand (e.g., a customer sent Mobile Money directly), a "Mark as successful" button sets `status = 'successful'`, `confirmed_by = admin id`, `confirmed_at = now()`, and moves the linked order to `paid`. Require a confirmation dialog.
- "Export CSV" button for the currently filtered rows.

**Webhook route** `app/api/webhooks/payment/route.ts`:

1. Read the raw body and verify the signature/secret header against `PAYMENT_WEBHOOK_SECRET`. Return 401 if invalid.
2. Find the payment by `provider_reference` (upsert, so duplicate webhooks do not create duplicates).
3. Check the amount matches the order total. If not, mark for review instead of paying.
4. Update `payments.status`; if successful, set the order to `paid`.
5. Store the full body in `raw_payload`.
6. Always return 200 quickly after processing so the provider does not retry forever.

Write it provider-agnostic (a single `parsePaymentEvent(body)` function) so the exact provider (Flutterwave, CamPay, Notchpay, Monetbil, etc.) can be plugged in later.

### 6.6 Users (`/admin/users`) — all authenticated accounts

- Table: avatar, full name, email, phone, role badge, joined date, number of orders, total spent.
- Search by name/email/phone. Filter by role. Pagination.
- Detail page: profile info, list of their orders, list of their payments, lifetime spend.
- Admin can promote/demote a user between `customer` and `admin` (confirmation dialog, cannot demote yourself).
- Read-only for everything else. No deleting auth users in Phase 1.

---

## 7. File structure to create

```
app/
  admin/
    layout.tsx                 # server-side admin guard + sidebar + topbar
    page.tsx                   # overview
    products/
      page.tsx
      new/page.tsx
      [id]/page.tsx
      actions.ts               # server actions (create/update/delete)
    categories/
      page.tsx
      actions.ts
    orders/
      page.tsx
      [id]/page.tsx
      actions.ts
    payments/
      page.tsx
      [id]/page.tsx
      actions.ts
    users/
      page.tsx
      [id]/page.tsx
      actions.ts
  api/webhooks/payment/route.ts
components/admin/
  sidebar.tsx
  topbar.tsx
  stat-card.tsx
  data-table.tsx               # reusable table with search/filter/pagination
  status-badge.tsx
  product-form.tsx
  image-uploader.tsx
  confirm-dialog.tsx
lib/
  supabase/client.ts           # browser client
  supabase/server.ts           # server client (cookies)
  supabase/admin.ts            # service-role client (server only)
  auth.ts                      # requireAdmin() helper
  format.ts                    # formatPrice(), formatDate()
  validations.ts               # Zod schemas
middleware.ts
```

`requireAdmin()` helper: gets the session, loads the profile, throws/redirects if not admin. Call it at the top of every admin page and every server action.

---

## 8. Build order (do it in this order, test after each step)

1. Run the SQL (Section 4), sign up on the site, make yourself admin.
2. `lib/supabase/*`, `lib/auth.ts`, `middleware.ts`, `app/admin/layout.tsx` (guard + sidebar + topbar). Confirm a non-admin gets redirected.
3. Categories page (small, gets the pattern working).
4. Products: list, then create/edit form, then image uploader, then delete.
5. Users list + detail.
6. Orders list + detail + status change.
7. Payments list + detail + manual confirm + webhook route.
8. Overview page with stats and chart.
9. Polish: loading skeletons, empty states, error toasts, mobile sidebar.

---

## 9. Acceptance checklist

- [ ] Dashboard uses the storefront's colors, fonts, radius, and components (no new style).
- [ ] A non-admin (or logged-out) user cannot open `/admin` or call any admin action.
- [ ] Admin can create a product with description, price, category, stock, and multiple images; it shows up on the storefront.
- [ ] Editing/deleting a product also updates/removes its images in Storage.
- [ ] Admin sees every registered user, with their orders and spend.
- [ ] Admin sees every payment with status, provider, payer, and amount; can filter and export CSV.
- [ ] Payment webhook rejects requests with a bad signature and does not create duplicates.
- [ ] Manual "Mark as successful" updates the payment and the order.
- [ ] Works on mobile (sidebar becomes a sheet, tables scroll horizontally).
- [ ] No tracking / shipping features were added.
- [ ] `pnpm build` passes with no TypeScript errors.

---

## 10. Later (Phase 2, not now)

Inventory bulk import/export, coupons, order tracking and delivery fees, staff roles (manager/support), review moderation, CMS for banners, audit log of admin actions.