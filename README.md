# KAPEBURAK Coffee Storefront

A responsive coffee-shop storefront for KAPEBURAK in Iloilo City. The catalog, product images, and guest orders use Supabase. Vercel serves the static frontend; a Supabase Edge Function validates and saves checkout requests.

## Supabase setup

1. Create a Supabase project and install the [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Link this repository to the project and apply the database migration:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

   The migration creates and seeds the `products` table, creates private `orders` and `order_items` tables, enables row-level security, and creates the public `product-images` storage bucket.
3. Deploy the public guest-order function:

   ```bash
   supabase functions deploy create-order
   ```

   The guest checkout endpoint accepts unauthenticated requests by design. Supabase provides the function's server-side `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Do not put the service-role key in the frontend or Vercel's `VITE_` variables.
4. Copy `.env.example` to `.env` for local development and set the project URL and publishable/anon key. Then run:

   ```bash
   pnpm install
   pnpm dev:static
   ```

## Vercel deployment

Import the repository into Vercel and set:

- Framework preset: **Vite**
- Root directory: `./`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build:static`
- Output directory: `dist/public`

Add these environment variables in the Vercel project settings for each deployment environment:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase publishable key (or legacy anon key)

Redeploy after setting or changing environment variables. The Supabase Edge Function is deployed separately from Vercel.

## Products, images, and orders

The migration seeds the eight current menu items. Manage prices and availability in Supabase's `products` table; prices are stored as integer Philippine centavos. To add an image, upload it to the `product-images` storage bucket and set the matching `products.image_path` to its bucket-relative path. Image files are not included in this repository yet; products display a placeholder until an image is uploaded.

Guest checkout saves the customer's details, selected products/options, authoritative database prices, fulfillment choice, and order totals in Supabase. Review orders in the Supabase `orders` and `order_items` tables. Order inserts are only allowed through the Edge Function and a database function using the service-role key; browser clients cannot read order/customer data or write prices. Payment status remains pending and no payment is collected online. PayMongo integration is not included yet. Before accepting production traffic, add an anti-abuse control such as CAPTCHA and rate limiting to the public order endpoint.

This storefront uses guest checkout and has no customer sign-in flow. Supabase Auth is available for a future staff/customer account feature. The repository still contains unused Express/Manus starter code; the Vercel storefront and Supabase order flow do not depend on it.

## Checks

```bash
pnpm check
pnpm test
pnpm build:static
```
