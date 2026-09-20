# Backend Precautions Checklist

> Companion to `ADMIN_DASHBOARD_SPEC.md` and `BACKEND_IMPLEMENTATION_PLAN.md`.
> Those files build the features. **This file makes them safe.** Every item has a reason, and where code is needed, the code is included.
>
> **Tell your AI agent:** *"Read BACKEND_PRECAUTIONS.md. Apply Sections 1 to 6 to the existing code, one section at a time, and stop after each so I can test. Do not remove existing features."*

Sections:
1. Payments and double debit
2. Account creation and duplicate accounts
3. Money handling, audit trail, reconciliation
4. SEO-friendly components
5. One font everywhere (sidebar included)
6. Other things that go wrong with a badly handled backend
7. Pre-launch test plan

---

## 1. Payments and double debit

**How double debits actually happen:** the customer double-clicks "Pay", opens the page in two tabs, hits Back and pays again, refreshes during a slow response, or the provider sends the same webhook twice. Fix it in **three layers**: the button, the server, and the database. The database layer is the one that cannot be bypassed.

### 1.1 Database layer (run this SQL)

```sql
-- One checkout attempt = one order, even if the request is sent twice.
alter table public.orders add column if not exists idempotency_key text;

create unique index if not exists orders_user_idempotency_uniq
  on public.orders(user_id, idempotency_key)
  where idempotency_key is not null;

-- An order can have only ONE open (pending or successful) payment at a time.
-- Failed payments do not count, so a customer can retry after a failure.
create unique index if not exists payments_one_open_per_order
  on public.payments(order_id)
  where order_id is not null and status in ('pending', 'successful');

-- New status: money arrived twice for the same order and one must be refunded.
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'successful', 'failed', 'refunded', 'needs_refund'));
```

Already in place from the earlier files, and it must stay: `payments.provider_reference` is `unique` (the same transaction ID can never be recorded twice), and `apply_paid_order()` only acts on an order that is still `pending` (so stock is reduced once and the order is paid once).

### 1.2 Server layer: idempotent `placeOrder`

Changes to `app/checkout/actions.ts`:

**(a)** Add the key to the input schema:

```ts
const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  // ...all the other existing fields stay the same
})
```

**(b)** Add a limit on unpaid orders, right after `requireUser()` and parsing (stops abuse and accidental floods):

```ts
const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
const { count: recentPending } = await admin
  .from('orders')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('status', 'pending')
  .gte('created_at', since)

if ((recentPending ?? 0) >= 5) {
  return { ok: false, error: 'You have several unpaid orders. Please pay one or wait before creating another.' }
}
```

(`admin` must be created before this block, so move `const admin = createAdminClient()` up above it.)

**(c)** After `total` and `lines` are computed and **before** inserting the order, return the existing order if this exact attempt was already processed:

```ts
const { data: existing } = await admin
  .from('orders')
  .select('id, total, payments(id, status)')
  .eq('user_id', user.id)
  .eq('idempotency_key', input.idempotencyKey)
  .maybeSingle()

if (existing) {
  if (existing.total !== total) {
    return { ok: false, error: 'Your cart changed. Please refresh and try again.' }
  }
  const openPayment = existing.payments?.find((p) => p.status === 'pending' || p.status === 'successful')
  if (openPayment) {
    return { ok: true, orderId: existing.id, paymentId: openPayment.id, total: existing.total }
  }
}
```

**(d)** Save the key when inserting the order, and handle the race where two identical requests arrive at the same millisecond (the unique index rejects the second one):

```ts
const { data: order, error: oErr } = await admin
  .from('orders')
  .insert({
    user_id: user.id,
    idempotency_key: input.idempotencyKey,
    total,
    currency: 'XAF',
    status: 'pending',
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    customer_address: input.customerAddress,
    notes: input.notes || null,
  })
  .select('id')
  .single()

if (oErr?.code === '23505') {
  // The twin request won the race. Return what it created.
  const { data: twin } = await admin
    .from('orders')
    .select('id, total, payments(id, status)')
    .eq('user_id', user.id)
    .eq('idempotency_key', input.idempotencyKey)
    .single()
  const p = twin?.payments?.find((x) => x.status === 'pending' || x.status === 'successful')
  if (twin && p) return { ok: true, orderId: twin.id, paymentId: p.id, total: twin.total }
}
if (oErr || !order) return { ok: false, error: 'Could not create the order.' }
```

### 1.3 Button layer: `useCheckout` hook (complete)

`hooks/use-checkout.ts`

```ts
'use client'

import { useRef, useState } from 'react'
import { placeOrder } from '@/app/checkout/actions'

type CheckoutData = {
  items: { productId: string; quantity: number }[]
  customerName: string
  customerPhone: string
  customerAddress: string
  notes?: string
  provider: 'manual' | 'mtn_momo' | 'orange_money'
}

export function useCheckout() {
  // One key per checkout attempt. Same key on retry = same order.
  const [key, setKey] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const lock = useRef(false) // blocks a second click before React re-renders

  async function submit(data: CheckoutData) {
    if (lock.current) return null
    lock.current = true
    setBusy(true)
    try {
      return await placeOrder({ ...data, idempotencyKey: key })
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  // Call this whenever the cart or the form changes so the next attempt is a new order.
  function newAttempt() {
    setKey(crypto.randomUUID())
  }

  return { submit, busy, newAttempt }
}
```

Rules for the checkout UI:
- The pay button is `disabled={busy}` and shows "Processing..."; never re-enable it until the server answers.
- After a successful `placeOrder`, navigate away immediately to `/checkout/pay/[paymentId]`. If the user comes back with Back, the same payment is reused (thanks to the idempotency key and the one-open-payment index), not a new one.
- On network timeout, do **not** tell the customer to pay again. Tell them: "We are checking your order. Check My Orders before trying again."

### 1.4 Webhook layer: handle a second payment for an order that is already paid

The customer may pay at the provider twice (two tabs). The provider will send two different successful transactions. Only one may pay the order; the other must be flagged for refund. In `app/api/webhooks/payment/route.ts`, add this **right after** the "find the payment" block and the `successful` duplicate check, and before the amount-mismatch check:

```ts
// The order is already paid and this is a DIFFERENT successful transaction: customer was charged twice.
if (!payment && order.status !== 'pending' && event.status === 'successful') {
  await admin.from('payments').insert({
    provider: 'provider', // your provider name
    provider_reference: event.reference,
    order_id: order.id,
    user_id: order.user_id,
    amount: event.amount,
    currency: event.currency,
    status: 'needs_refund',
    payer_phone: event.payerPhone ?? null,
    payer_name: event.payerName ?? null,
    raw_payload: body as Record<string, unknown>,
    note: 'DUPLICATE PAYMENT: order was already paid. Refund this customer.',
  })
  return NextResponse.json({ received: true })
}
```

In the admin payments page: show `needs_refund` as a red badge, put a count of them in the dashboard overview, and add a "Mark refunded" action that sets `status = 'refunded'` (you do the actual refund in the provider's dashboard or by sending the money back manually).

### 1.5 Other payment rules

- **Never trust the browser's return URL.** Landing on `/payment-success?status=ok` proves nothing. A payment is real only when your **webhook** (or a call to the provider's "verify transaction" API) says so. Build `/checkout/status/[paymentId]` to poll your own database every few seconds and show "Waiting for confirmation" until the status changes.
- **Verify before paying out.** In the webhook, after the signature check, call the provider's verify-transaction endpoint and compare status and amount before marking anything paid. Most providers recommend this. Their docs show the exact call.
- **One provider transaction = one payment row.** Use `payment.id` as the reference you send to the provider. Before starting a new provider transaction for an order, reuse the existing pending payment.
- **Respond to webhooks fast** (return 200 within a few seconds after saving), or the provider will retry and you will process duplicates. The code above is safe against retries.
- **Stock and overselling:** stock is checked when the order is created and reduced when it is paid. Two customers can still pay for the last item at the same time. `apply_paid_order` stops stock at 0 instead of going negative, so watch for orders where you cannot fulfill everything and refund that customer. Add "orders with insufficient stock" to your daily check in Section 3.3.
- **Never ask for or store** card numbers, Mobile Money PINs, or passwords for payment. The provider handles that.
- Use **test keys** in development and **live keys** only in production. Never mix them.

---

## 2. Account creation and duplicate accounts

### 2.1 What is already protected

- Supabase Auth allows **one account per email** by design (it will not create a second user for the same email).
- The signup schema lowercases and trims the email, so `John@Mail.com` and `john@mail.com` are the same.
- The profile trigger uses `on conflict do nothing`, so a profile is never created twice.
- "Confirm email" is required, so people cannot register with an email they do not own.

### 2.2 What you must still do

1. **Block double submits on the form.** The signup and login buttons must use `disabled={pending}` (the forms in the implementation plan already do).
2. **Do not reveal which emails have accounts.** With email confirmation on, Supabase deliberately returns a success-looking response for an email that already exists. Keep your message generic ("Check your email"), and do not write code that says "this email is already registered". Test this once by signing up twice with the same email and confirming there is one user.
3. **Turn on bot protection.** In the Supabase dashboard, Authentication settings, enable CAPTCHA protection (Cloudflare Turnstile or hCaptcha) and review the rate limits for sign-ups, sign-ins and password resets. Without this, bots can create thousands of fake accounts and flood people with emails (which also hurts your email reputation).
4. **Password rules:** minimum 8 characters (enforced), and enable leaked-password protection if your Supabase plan offers it.
5. **Phone numbers:** do not make phone unique unless you verify phones by SMS. Family members sharing a phone is normal, and a wrong unique rule blocks real customers.
6. **Roles cannot be self-assigned.** New users are always `customer`. The policy in the spec stops users changing their own role. Only an admin (or you in the SQL editor) can promote someone. Test this: log in as a customer and try to update your own role from the browser console; it must fail.
7. **Admin accounts get extra protection:** strong unique password, and keep the number of admins small.
8. **Session safety:** always use `supabase.auth.getUser()` on the server (the plan already does). Never trust `getSession()` alone for security decisions.
9. **Redirect safety:** the `safeNext()` helper stops attackers sending users to another site after login. Keep using it for every `next` parameter.

---

## 3. Money handling, audit trail, reconciliation

### 3.1 Rules for money in code

- Store amounts as **integers** (XAF has no decimals). Never use floating point for money. If you ever add USD, store cents.
- Always store the **currency** next to the amount (already in the schema).
- Compute totals **on the server from database prices**, never from the browser (already in `placeOrder`).
- Keep an **order item snapshot** of name and price (already in `order_items`), so changing a product price later does not change old orders.
- Show prices to customers with one formatter (`formatPrice()`), so the same amount never appears two different ways.

### 3.2 Audit log (who did what)

If money is disputed, you must be able to say which admin confirmed a payment and when.

```sql
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,          -- e.g. 'payment.confirm', 'payment.reject', 'user.role_change', 'product.delete'
  entity text not null,          -- e.g. 'payment', 'user', 'product'
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create policy "audit_admin_read" on public.admin_audit_log
  for select using (public.is_admin());
create policy "audit_admin_insert" on public.admin_audit_log
  for insert with check (public.is_admin() and admin_id = auth.uid());
-- No update or delete policies: the log cannot be edited from the app.
```

`lib/audit.ts`

```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  // Never let a logging failure break the real action.
  await supabase
    .from('admin_audit_log')
    .insert({ admin_id: adminId, action, entity, entity_id: entityId ?? null, details: details ?? null })
    .then(() => {}, () => {})
}
```

Call it in: `confirmPayment`, `rejectPayment`, mark refunded, role changes, product delete, post delete. Example in `confirmPayment` after the update succeeds:

```ts
const { supabase, user } = await requireAdmin()
// ...
await logAdminAction(supabase, user.id, 'payment.confirm', 'payment', paymentId, { order_id: payment.order_id })
```

Add a simple read-only `/admin/audit` page listing the latest 100 entries.

### 3.3 Daily reconciliation queries

Run these in the Supabase SQL editor once a day (or build them into an `/admin/health` page). Each should return **zero rows**; anything returned needs a human.

```sql
-- 1. Payments stuck pending for more than 24 hours
select id, provider, provider_reference, amount, payer_phone, created_at
from public.payments
where status = 'pending' and created_at < now() - interval '24 hours';

-- 2. Successful payment but the order is not paid
select p.id as payment_id, o.id as order_id, o.status
from public.payments p
join public.orders o on o.id = p.order_id
where p.status = 'successful' and o.status = 'pending';

-- 3. Paid order with no successful payment
select o.id, o.order_number, o.total
from public.orders o
where o.status = 'paid'
  and not exists (
    select 1 from public.payments p where p.order_id = o.id and p.status = 'successful'
  );

-- 4. Customers charged twice (need a refund)
select id, order_id, amount, provider_reference, note
from public.payments
where status = 'needs_refund';

-- 5. Amount mismatches waiting for review
select id, order_id, amount, note
from public.payments
where status = 'pending' and note like 'Amount mismatch%';

-- 6. Products at zero stock that still have paid, unfulfilled orders
select p.id, p.name, p.stock
from public.products p
where p.stock = 0 and p.is_active = true;
```

Also once a week, compare the total of `successful` payments against your provider's dashboard or your MoMo statement. If the numbers differ, find out why before it grows.

---

## 4. SEO-friendly components

### 4.1 Rules

1. **Public pages render on the server.** Product pages, category pages and blog pages must be Server Components that fetch data on the server, so search engines receive the real content in the HTML. Do not load main content with `useEffect` in a client component.
2. **One `<h1>` per page**, headings in order (h1, then h2, then h3). Use `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>` instead of `<div>` everywhere.
3. **Every product and post has a unique, clean slug and a unique title and description.**
4. **Every image has meaningful `alt` text** (the product name at minimum) and uses `next/image` with a width and height (or `fill` with a sized parent) so the page does not jump while loading.
5. **Draft and inactive items must not be indexable** (the queries already filter them; a missing item must return a real 404 via `notFound()`).
6. **Admin, account, checkout and auth pages are `noindex`** and blocked in `robots.txt`.
7. **Fast pages rank better.** Use `next/font` (one font, Section 5), size images properly, and avoid huge client-side bundles on public pages.
8. If the shop serves French and English, set the correct `lang` on `<html>` and add `alternates.languages` (hreflang). If you only use one language, set `lang` to that one.

### 4.2 `next.config.ts` (allow optimized Supabase images)

Merge this into your existing config (it may be `next.config.mjs`; keep whatever else is already there):

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
```

Then replace the plain `<img>` tags in the product and blog pages with `next/image`:

```tsx
import Image from 'next/image'

<Image
  src={post.cover_image_url}
  alt={post.title}
  width={1200}
  height={630}
  className="w-full rounded-lg object-cover"
  priority // only for the main image at the top of the page
/>
```

### 4.3 Public Supabase client (cacheable, no cookies)

`lib/supabase/public.ts`. For public data only. Using the cookie-based client makes every page dynamic and slower; this one lets Next.js cache.

```ts
import { createClient } from '@supabase/supabase-js'

export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
```

Use it in product pages, blog pages, the sitemap and `generateMetadata`. Row Level Security still applies (public can only read active products and published posts).

### 4.4 Root layout metadata

In `app/layout.tsx` (merge with the existing file):

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    default: 'Your Shop Name',
    template: '%s | Your Shop Name',
  },
  description: 'One clear sentence describing what you sell and where you deliver.',
  openGraph: {
    siteName: 'Your Shop Name',
    type: 'website',
  },
}
```

### 4.5 Product page metadata + structured data

Adjust the route (`/products/[slug]`) to match the storefront's real product route.

```tsx
// app/products/[slug]/page.tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabasePublic } from '@/lib/supabase/public'
import { ProductJsonLd } from '@/components/seo/product-json-ld'

export const revalidate = 300 // refresh cached page at most every 5 minutes

async function getProduct(slug: string) {
  const { data } = await supabasePublic
    .from('products')
    .select('id, name, slug, description, price, stock, product_images(url, position, is_primary)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product not found', robots: { index: false } }

  const image = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position)[0]?.url
  const description = (product.description ?? '').replace(/\s+/g, ' ').trim().slice(0, 155)

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: image ? [{ url: image }] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <ProductJsonLd
        name={product.name}
        description={product.description ?? ''}
        images={images.map((i) => i.url)}
        price={product.price}
        inStock={product.stock > 0}
        url={`${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`}
      />
      <h1 className="text-3xl font-semibold">{product.name}</h1>
      {images[0] && (
        <Image
          src={images[0].url}
          alt={product.name}
          width={800}
          height={800}
          priority
          className="mt-4 rounded-lg"
        />
      )}
      {/* Keep the storefront's existing price, description and add-to-cart UI here. */}
    </main>
  )
}
```

`components/seo/product-json-ld.tsx`

```tsx
export function ProductJsonLd(props: {
  name: string
  description: string
  images: string[]
  price: number
  inStock: boolean
  url: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: props.name,
    description: props.description,
    image: props.images,
    offers: {
      '@type': 'Offer',
      url: props.url,
      priceCurrency: 'XAF',
      price: props.price,
      availability: props.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <script
      type="application/ld+json"
      // The replace stops a "</script>" inside a product description from breaking out of the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
```

Do the same `generateMetadata` for `/blog/[slug]` (title = post title, description = excerpt, openGraph image = cover image).

### 4.6 `app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next'
import { supabasePublic } from '@/lib/supabase/public'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL!

  const [products, posts] = await Promise.all([
    supabasePublic.from('products').select('slug, updated_at').eq('is_active', true),
    supabasePublic.from('posts').select('slug, updated_at').eq('status', 'published'),
  ])

  return [
    { url: site, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${site}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    ...(products.data ?? []).map((p) => ({
      url: `${site}/products/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(posts.data ?? []).map((p) => ({
      url: `${site}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
```

### 4.7 `app/robots.ts`

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL!
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/account', '/checkout', '/api', '/login', '/signup', '/reset-password', '/forgot-password'],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  }
}
```

`robots.txt` only asks crawlers to stay away; it does not guarantee a page stays out of Google. Also add this to `app/admin/layout.tsx`, and to the layouts of `/account`, `/checkout` and the auth pages:

```tsx
export const metadata = { robots: { index: false, follow: false } }
```

After deploying, submit `https://yourdomain/sitemap.xml` in Google Search Console and check the Pages report for problems.

---

## 5. One font everywhere (sidebar included)

**Why the sidebar font goes wrong (usual causes):**
1. The font class was put on a wrapper `<div>` instead of on `<html>` or `<body>`. The mobile sidebar (`Sheet`), dialogs, dropdowns and toasts render in a **portal outside that div**, so they lose the font. This is the most common cause of "the sidebar has a different font".
2. The admin area has its own layout that sets another font (or its own `<html>`/`<body>`).
3. A component hard-codes `font-mono`, `font-serif` or `style={{ fontFamily: ... }}`.
4. A CSS reset or a copied component set `font-family` on buttons/inputs to something other than `inherit`.

**The rule:** the font is defined **once**, in the root layout, on `<html>`. Nothing else ever sets a font family.

### 5.1 Root layout (`app/layout.tsx`)

**Keep the font the storefront already uses.** Open the current `app/layout.tsx`, see which font it imports, and reuse exactly that. Inter is only an example:

```tsx
import { Inter } from 'next/font/google'
import './globals.css'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
```

The font variable is on `<html>`, so portals (which are children of `<body>`) inherit it.

### 5.2 Point Tailwind at the variable

**Tailwind v4** (what V0 usually generates), in `globals.css`:

```css
@theme inline {
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
}
```

If `globals.css` already has an `@theme inline` block, add the `--font-sans` line to it instead of creating a second block. If the existing block uses a different variable name than `--font-sans` for the same font (for example `--font-inter`), keep the existing name and use it consistently.

**Tailwind v3**, in `tailwind.config.ts`:

```ts
import { fontFamily } from 'tailwindcss/defaultTheme'

// inside theme.extend:
fontFamily: {
  sans: ['var(--font-sans)', ...fontFamily.sans],
},
```

### 5.3 Rules for the admin sidebar and every admin component

- `app/admin/layout.tsx` must **not** render its own `<html>` or `<body>`, and must not set any font class.
- Sidebar, topbar, tables, dialogs and sheets must not contain `font-mono`, `font-serif`, or inline `fontFamily`. Only weight and size classes (`font-medium`, `text-sm`) are allowed. Use `font-mono` only for things like transaction IDs, and even then only on that one element.
- Buttons and inputs must inherit: if any component looks different, check that `globals.css` (or Tailwind's base layer) contains `font-family: inherit` for `button, input, select, textarea`.
- Do not import a second font anywhere in the admin section.
- If a Google font import was added inside a component or a separate CSS file, delete it.

### 5.4 How to verify (2 minutes)

1. Open the storefront, open DevTools, inspect a normal paragraph, and note the **Computed** `font-family` value.
2. Open `/admin`, inspect a sidebar link, the topbar name, a table cell and a button. All must show the same computed value.
3. Open the **mobile sidebar** (narrow the window), then a dialog, a dropdown menu and a toast. Inspect each. These are the ones that break when the font is on a wrapper div.
4. Search the project: `font-mono`, `font-serif`, `fontFamily` and `font-family` should not appear in sidebar or admin layout files.

---

## 6. Other things that go wrong with a badly handled backend

| Problem | What happens | Prevention |
|---|---|---|
| **Row Level Security off** on a table | Anyone can read or edit that table using the public key, including other customers' orders | Keep RLS enabled on every table. The Supabase dashboard flags tables without it. Test by trying to read someone else's order. |
| **Service role key leaks** | Full database access for an attacker | Server-only file (`import 'server-only'`), never `NEXT_PUBLIC_`, never committed to Git. If leaked, rotate it in Supabase immediately. |
| **Admin checks only in the UI** | A customer calls the admin action directly and deletes products | `requireAdmin()` at the top of every admin action and page (already done). |
| **Upload limits only in the browser** | Someone bypasses the browser and uploads huge or fake files, filling your storage | Enforce limits on the bucket itself (SQL below). |
| **Orphaned images** | Storage fills with files no product uses | Upload-then-save with cleanup on failure (already in the plan). Delete storage files when deleting rows (already done). |
| **No indexes / no pagination** | Admin pages become slow as data grows | Indexes exist in the SQL. Always paginate (20 per page) and select only the columns you show. |
| **Raw errors shown to users** | Confusing screens, and error messages can leak internals | Add `error.tsx` and `not-found.tsx` (below). Show friendly messages, log the real error. |
| **No logging or monitoring** | Payments fail and you find out from angry customers | Add error tracking (Sentry has a free tier) and check the Supabase logs and your host's function logs. Alert yourself on webhook failures. |
| **No rate limits on checkout / forgot password** | Abuse, spam, email bills | Unpaid-order limit (Section 1.2), CAPTCHA and Supabase auth rate limits (Section 2.2). |
| **Webhook slow or crashing** | Provider retries, duplicates, missed payments | Fast handler, idempotent logic (Section 1), and the daily reconciliation queries (Section 3.3). |
| **XSS through admin-written content** | Malicious script runs on customers' browsers | Markdown renders through `react-markdown` without raw HTML (already done). Never use `dangerouslySetInnerHTML` with user or admin text, except the escaped JSON-LD above. |
| **Open redirects** | Phishing links that start on your domain | `safeNext()` on every redirect (already done). |
| **Same database for testing and live** | You delete real customer data while testing | Create **two** Supabase projects (dev and production) and two sets of env variables. |
| **Changing the database by hand** | You cannot reproduce or roll back changes | Save every SQL change as a file in `supabase/migrations/` and commit it to Git. |
| **No backups** | One mistake or outage and the shop's data is gone | Check what your Supabase plan includes. Do not rely on backups on a free plan. Export your database regularly (`pg_dump`) and store it somewhere separate. |
| **Free plan limits** | Projects on the free tier can be paused after inactivity, and storage/bandwidth caps apply | Check current limits. Move a live shop to a paid plan before launch. |
| **Emails not arriving** | Customers cannot confirm accounts or reset passwords | Custom SMTP, and set up SPF and DKIM on your domain through the email provider. |
| **Wrong timezones** | Reports show the wrong day | Timestamps are stored as `timestamptz` (done). Display them in the Africa/Douala timezone. |
| **Outdated packages** | Known security holes | Run `pnpm audit` regularly and update dependencies. |
| **No legal pages** | Customer disputes, provider account rejected | Add Terms, Refund policy and Privacy policy pages, and link them in the footer and at checkout. Payment providers often require them. |

### 6.1 Enforce upload limits on the buckets themselves

```sql
update storage.buckets
set file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('product-images', 'post-images');
```

### 6.2 Friendly error pages

`app/error.tsx`

```tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error) // replace with your error tracker (e.g. Sentry) later
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        Please try again. If it keeps happening, contact us and mention this code: {error.digest ?? 'n/a'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

`app/not-found.tsx`

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Button asChild>
        <Link href="/">Back to the shop</Link>
      </Button>
    </div>
  )
}
```

Add an `error.tsx` inside `app/admin/` too, so an admin page error does not take down the whole site.

---

## 7. Pre-launch test plan

Do all of these on a **test** Supabase project with **test** payment keys before touching real money.

**Double debit**
- [ ] Double-click the Pay button quickly: exactly one order and one payment exist.
- [ ] Open checkout in two tabs and submit both: one order.
- [ ] Place an order, press Back, submit again: same order and payment reused, no duplicates.
- [ ] Reuse the same MoMo transaction reference on a second order: rejected.

**Webhook (save this as `scripts/test-webhook.mjs`; works on Windows, needs Node 20.6+)**

```js
import crypto from 'node:crypto'

const [orderId, amount, reference] = process.argv.slice(2)
if (!orderId || !amount) {
  console.error('Usage: node --env-file=.env.local scripts/test-webhook.mjs ORDER_ID AMOUNT [REFERENCE]')
  process.exit(1)
}

const body = JSON.stringify({
  reference: reference ?? `TEST-${Date.now()}`,
  order_id: orderId,
  amount: Number(amount),
  currency: 'XAF',
  status: 'success',
})

const signature = crypto
  .createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET)
  .update(body)
  .digest('hex')

const res = await fetch('http://localhost:3000/api/webhooks/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-signature': signature },
  body,
})

console.log(res.status, await res.text())
```

This matches the example signature scheme in the plan. If you adapted `verifySignature` and `parsePaymentEvent` to your provider, adapt the script's body and signature the same way.

- [ ] Send a correct webhook: payment `successful`, order `paid`, stock reduced by the ordered quantity.
- [ ] Send the **same** webhook again (same reference): nothing changes, stock is not reduced again.
- [ ] Send a webhook with a **different** reference for the already-paid order: a `needs_refund` payment appears.
- [ ] Send a webhook with a wrong amount: payment stays `pending` with a mismatch note, order not paid.
- [ ] Send a webhook with a wrong or missing signature: rejected with 401.

**Accounts**
- [ ] Sign up twice with the same email (also with different capital letters): one user only.
- [ ] Confirmation email arrives (check spam) and logs you in through the callback.
- [ ] As a customer, try changing your own role: fails.
- [ ] As a customer, open `/admin` and call an admin action directly: blocked.
- [ ] Bot protection is active on signup.

**Security**
- [ ] Search the codebase for `SUPABASE_SERVICE_ROLE_KEY`: only in server files.
- [ ] Upload a `.exe` renamed to `.jpg` and a 20 MB image: both rejected.
- [ ] As a customer, try reading another customer's order through the Supabase client: returns nothing.

**SEO and design**
- [ ] View page source of a product page: the product name and description are in the HTML.
- [ ] `/sitemap.xml` lists products and posts, not drafts or inactive products.
- [ ] `/robots.txt` blocks `/admin`, `/checkout` and `/account`.
- [ ] Google's Rich Results Test accepts the product structured data (test after deploying).
- [ ] Sidebar, mobile sidebar, dialogs and toasts all show the same font as the storefront (Section 5.4).
- [ ] Lighthouse on the home and product pages: check SEO and Performance scores and fix the biggest issues.

**Operations**
- [ ] Reconciliation queries from Section 3.3 all return zero rows after testing.
- [ ] Custom SMTP is configured and tested.
- [ ] Live keys and live Supabase project are separate from test ones.
- [ ] A backup or export exists and you have tried restoring it at least once.
- [ ] Terms, Refund and Privacy pages exist and are linked.