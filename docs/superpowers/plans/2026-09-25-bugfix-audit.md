# Bugfix & Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix P0/P1 bugs (security, data-integrity, routing, env handling) and add professional README.

**Architecture:** Minimal surgical fixes per file, no refactors. Verify with `npx tsc --noEmit` + `npm run build`. Commit and push.

**Tech Stack:** Next.js 16, React 19, Supabase (SSR + service-role), NotchPay, Tailwind 4, zod, react-hook-form.

**Spec:** Subagent audit reports (storefront / checkout-payments-auth / admin) + `Backend.md`, `dashboard.md`, `supabase/schema.sql` in repo root.

## Global Constraints

- Do not commit `.env` (already gitignored).
- Do not change public UI copy unless fixing a bug.
- One logical fix per commit; verify build before push.
- Redact real secrets from `.env.example`.

---

### Task 1: Build config + package metadata

**Files:**
- Modify: `next.config.mjs:1-10`
- Modify: `package.json:1-10`

**Interfaces:**
- Consumes: none
- Produces: strict TS build, correct package name

- [ ] **Step 1: Remove `ignoreBuildErrors`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Rename package + add lint script**

```json
{
  "name": "mixtas-fashion-store",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: PASS (exit 0)

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs package.json
git commit -m "fix: enforce strict TS build and correct package metadata"
```

### Task 2: Catalog + store cart correctness

**Files:**
- Modify: `lib/catalog.ts:230-247`
- Modify: `components/store.tsx:9-16`

**Interfaces:**
- Consumes: `Product`, `CartItem`
- Produces: `getProduct(id): Product|undefined`, `getBlogPost(slug): BlogPost|undefined`, `money()`, empty `initialCart`, size-aware cart ops

- [ ] **Step 1: Fix catalog fallbacks**

```ts
export function money(value: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0 FCFA'
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}
export function getProduct(id: string) { return products.find((product) => product.id === id) }
export function getBlogPost(slug: string) { return blogPosts.find((p) => p.slug === slug) }
export const initialCart: CartItem[] = []
```

Add `'Jackets'` to `categories` so 6 jacket products are reachable.

- [ ] **Step 2: Fix size-aware cart ops**

```ts
const removeFromCart = (id: string, size?: string) => setCart((items) => items.filter((item) => !(item.product.id === id && (size === undefined || item.size === size))))
const updateQuantity = (id: string, quantity: number, size?: string) => setCart((items) => items.map((item) => (item.product.id === id && (size === undefined || item.size === size)) ? { ...item, quantity: Math.max(1, quantity) } : item))
```

Update `StoreContextValue` type accordingly.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/catalog.ts components/store.tsx
git commit -m "fix: correct catalog 404 handling, empty cart default, size-aware cart ops"
```

### Task 3: Product routing + detail page

**Files:**
- Modify: `app/product/[id]/page.tsx:8,13-52`
- Modify: `app/products/[id]/page.tsx:1-5`

**Interfaces:**
- Consumes: `getProduct`, `supabasePublic`
- Produces: correct 404 for unknown IDs, no duplicate content

- [ ] **Step 1: Fix type import + fallback**

```tsx
import { getProduct as getCatalogProduct, money, relatedProducts, products as staticProducts, type Product } from '@/lib/catalog'
```

In `fetchProduct`, replace `return getCatalogProduct(idOrSlug)` fallback with `return staticFound ?? null` logic: check static first, then Supabase, then `return null`. Use robust UUID regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`. Type images as `{ is_primary?: boolean; url?: string }[]`.

- [ ] **Step 2: Redirect plural alias**

```tsx
import { redirect } from 'next/navigation'
export default async function ProductsAlias({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/product/${id}`)
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add "app/product/[id]/page.tsx" "app/products/[id]/page.tsx"
git commit -m "fix: correct product 404 handling and de-duplicate /products alias"
```

### Task 4: Supabase env guards + NotchPay server-only

**Files:**
- Modify: `lib/supabase/server.ts:9-10`, `lib/supabase/client.ts:7-8`, `lib/supabase/public.ts:5-6`, `lib/supabase/admin.ts:11`, `lib/payments/notchpay.ts:1-39`

**Interfaces:**
- Consumes: env vars
- Produces: explicit throw on missing env, no fake-success payments

- [ ] **Step 1: Throw on missing env**

```ts
if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
```

Apply in server/client/public. In admin.ts also guard `NEXT_PUBLIC_SUPABASE_URL`.

- [ ] **Step 2: Fix server-only + fake success**

```ts
import 'server-only'
```

Replace fake `success:true` fallback with `success:false, error:'Payment gateway not configured'` and extend placeholder check to `pk_test_xxxxxxxx`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/server.ts lib/supabase/client.ts lib/supabase/public.ts lib/supabase/admin.ts lib/payments/notchpay.ts
git commit -m "fix: harden Supabase env handling and NotchPay misconfiguration path"
```

### Task 5: Auth + middleware hardening

**Files:**
- Modify: `lib/auth.ts:14-27`
- Modify: `middleware.ts:41-57`

**Interfaces:**
- Consumes: Supabase session
- Produces: no cookie bypass, safe TS narrowing

- [ ] **Step 1: Fix requireAdmin narrowing**

```ts
if (!user) redirect('/admin/login')
const userId = user.id
const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', userId).single()
if (error || !profile || profile.role !== 'admin') redirect('/')
```

- [ ] **Step 2: Remove cookie bypass**

Delete `hasAdminCookie` checks. Require `user` for admin routes. Keep login redirect when logged in based on `user` only.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts middleware.ts
git commit -m "fix: remove forgeable admin cookie bypass, tighten requireAdmin"
```

### Task 6: Checkout integrity + webhook idempotency

**Files:**
- Modify: `app/checkout/actions.ts:35-100,148-153`
- Modify: `app/api/webhooks/notchpay/route.ts:20-29,98-102,121-124,180-183`
- Modify: `app/checkout/notchpay-actions.ts:64-71`
- Modify: `lib/format.ts:14-35`

**Interfaces:**
- Consumes: `checkoutSchema`, NotchPay API
- Produces: server-computed totals, orphan cleanup, idempotent webhook

- [ ] **Step 1: Server-computed total + orphan cleanup**

Compute `computedTotal = sum(price*qty) + shipping (2500 if subtotal<50000 else 0)`. If `abs(computedTotal - validated.total) > 0`, use computedTotal (do not trust client). On `itemsError`, delete created order then return error. On payment insert failure, delete created order + items path (delete order cascades or explicit deletes) then return error.

- [ ] **Step 2: Webhook guards**

Add env guard for `NOTCHPAY_WEBHOOK_HASH` + `NOTCHPAY_PUBLIC_KEY` (return 500 with clear log if missing). Merge `raw_payload` (`{...existing, ...body}`) instead of overwrite. On duplicate `successful`, return `{received:true}` without re-calling RPC. Add `.eq('status','pending')` to success update.

- [ ] **Step 3: NotchPay key + date guards**

Use `NOTCHPAY_PRIVATE_KEY || NOTCHPAY_PUBLIC_KEY` with missing-key early return. In `formatDate/formatDateTime`, return `'N/A'` when `isNaN(date.getTime())`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/checkout/actions.ts app/api/webhooks/notchpay/route.ts app/checkout/notchpay-actions.ts lib/format.ts
git commit -m "fix: server-computed checkout totals, orphan cleanup, idempotent webhook"
```

### Task 7: Admin read-auth + README + push

**Files:**
- Modify: `app/admin/products/actions.ts`, `app/admin/orders/actions.ts`, `app/admin/categories/actions.ts`, `app/admin/payments/actions.ts`, `app/admin/users/actions.ts`
- Create: `README.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `requireAdmin`
- Produces: protected admin reads, public README, redacted example env

- [ ] **Step 1: Add requireAdmin to read actions**

Insert `await requireAdmin()` at top of `getProducts`, `getProductById`, `getOrders`, `getOrderById`, `getCategories`, `getPayments`, `getPaymentById`, `getPaymentStats`, `getUsers`, `getUserById`.

- [ ] **Step 2: Redact .env.example**

Replace real Supabase URLs/keys with `https://your-project.supabase.co` / `your_anon_key_here` / `your_service_role_key_here`.

- [ ] **Step 3: Write README**

Cover: overview, stack, features, folder structure, setup, env vars, Supabase schema, auth flow, checkout/NotchPay flow + webhook, admin, API/routes, scripts, deployment, security notes, known limitations, roadmap.

- [ ] **Step 4: Verify + push**

Run: `npx tsc --noEmit` then `npm run build`
Expected: both PASS
```bash
git add -A
git commit -m "docs: add professional README and redact example secrets"
git push origin HEAD
```
