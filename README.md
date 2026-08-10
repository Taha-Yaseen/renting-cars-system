# DriveRent — Multi-company car rental SaaS

A React SPA for managing car rental businesses. Each company gets an isolated workspace. Accounts are **admin-provisioned** (no public signup). Built with Vite, Tailwind CSS, Supabase Auth, and Row Level Security.

## Features

- **Login-only auth** — company owners sign in with credentials you create
- **Platform admin dashboard** — create companies and owner accounts (Edge Function + service role)
- **Tenant isolation** — cars, clients, rentals, payments, and oil records scoped by `company_id` + RLS
- **Dashboard / Cars / Clients / Rentals** — same operational UI as before, per company

## Getting Started

```bash
npm install
cp .env.example .env
# fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Supabase env vars are **required**. Local `localStorage` demo mode is no longer the default path.

## Supabase setup

### 1. Project + API keys

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon public** key into `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never put the **service role** key in Vite / GitHub Pages secrets.

### 2. Migrations (keeps existing data)

1. Confirm `001` … `010` are already applied on your project.
2. Optional but recommended: download a backup / CSV export of `cars`, `clients`, `rentals`, etc.
3. Run [`supabase/migrations/011_multi_tenant_auth.sql`](supabase/migrations/011_multi_tenant_auth.sql) in the SQL Editor.

This migration:

- Does **not** truncate your business tables
- Creates `companies` / `company_members` / `platform_admins`
- Creates a company named **Legacy Company** (if none exists yet)
- Sets `company_id` on all existing cars, clients, rentals, payments, oil records to that company
- Replaces open anon RLS with tenant + auth policies

Then run these follow-ups (replace UUIDs / names):

```sql
-- Rename the migrated company
update public.companies
set name = 'Your Real Company Name', owner_email = 'owner@email.com'
where id = (select id from public.companies order by created_at limit 1);

-- After creating Auth users in the dashboard:
insert into public.platform_admins (user_id) values ('<admin-user-uuid>');

insert into public.company_members (company_id, user_id, role)
values (
  (select id from public.companies order by created_at limit 1),
  '<owner-user-uuid>',
  'owner'
);
```

Do **not** recreate that same company in the admin UI — it already owns your old rows. Use the admin UI only for *new* companies afterward.

### 3. Auth settings

1. Authentication → Providers → Email enabled.
2. Disable public **Sign ups** (only Admin API / Edge Function should create users).
3. Authentication → URL configuration:
   - Site URL: your GitHub Pages URL (e.g. `https://<user>.github.io/renting-cars-system/`)
   - Redirect URLs: that origin + `http://localhost:5173`

### 4. Bootstrap the first platform admin

Covered in the SQL follow-ups above. After inserting into `platform_admins`, sign in with that user → **Platform Admin** dashboard.

If the company owner is a different Auth user, they must be in `company_members` (step 4 above) to see the migrated fleet data.

### 5. Deploy the Edge Function

```bash
# requires Supabase CLI logged in and linked to the project
supabase functions deploy create-company-account
```

The function uses `SUPABASE_SERVICE_ROLE_KEY` (injected automatically in Supabase Functions). It verifies the caller is in `platform_admins`, then creates the Auth user, `companies` row, and `company_members` owner row.

### 6. Create a company account

In the admin UI: company name + owner email + password → Create. Share credentials with the company owner securely. They log in and only see their data.

## GitHub Pages

Deploy still uses Actions with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` secrets. Deploy the Edge Function from your machine or CI separately; do not expose the service role to the frontend build.

## Tech stack

- React 19 + Vite
- Tailwind CSS v4
- Lucide React
- Supabase Auth + Postgres RLS + Edge Functions
