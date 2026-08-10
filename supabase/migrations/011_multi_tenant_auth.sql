-- Multi-tenant auth: companies, platform admins, tenant-scoped RLS.
-- Keeps existing business data by assigning all current rows to one company.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- EDIT THESE before running (optional but recommended)
-- ---------------------------------------------------------------------------
-- Default company name / owner email for your existing data:
--   (change the insert below if you prefer different values)

-- ---------------------------------------------------------------------------
-- Platform + tenancy tables
-- ---------------------------------------------------------------------------

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id),
  unique (user_id)
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists company_members_user_id_idx on public.company_members (user_id);

-- ---------------------------------------------------------------------------
-- Tenant column on business tables (nullable first so existing rows survive)
-- ---------------------------------------------------------------------------

alter table public.cars
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

alter table public.clients
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

alter table public.rentals
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

alter table public.oil_change_records
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cars'
      and column_name = 'oil_change_distance_unit'
  ) then
    alter table public.cars
      add column oil_change_distance_unit text default 'km'
      check (oil_change_distance_unit in ('km', 'mile'));
  end if;
end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rentals (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  date date not null,
  note text,
  company_id uuid references public.companies (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Create one company and attach all existing rows to it
-- ---------------------------------------------------------------------------

do $$
declare
  v_company_id uuid;
begin
  select id into v_company_id
  from public.companies
  order by created_at asc
  limit 1;

  if v_company_id is null then
    insert into public.companies (name, owner_email)
    values ('Legacy Company', null)
    returning id into v_company_id;
  end if;

  update public.cars set company_id = v_company_id where company_id is null;
  update public.clients set company_id = v_company_id where company_id is null;
  update public.rentals set company_id = v_company_id where company_id is null;
  update public.oil_change_records set company_id = v_company_id where company_id is null;
  update public.payments set company_id = v_company_id where company_id is null;

  raise notice 'Existing data attached to company_id=%', v_company_id;
end $$;

-- Enforce NOT NULL now that every row has a company
alter table public.cars alter column company_id set not null;
alter table public.clients alter column company_id set not null;
alter table public.rentals alter column company_id set not null;
alter table public.oil_change_records alter column company_id set not null;
alter table public.payments alter column company_id set not null;

create index if not exists cars_company_id_idx on public.cars (company_id);
create index if not exists clients_company_id_idx on public.clients (company_id);
create index if not exists rentals_company_id_idx on public.rentals (company_id);
create index if not exists oil_change_records_company_id_idx on public.oil_change_records (company_id);
create index if not exists payments_company_id_idx on public.payments (company_id);
create index if not exists payments_rental_id_idx on public.payments (rental_id);

alter table public.payments enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers (security definer) for RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

create or replace function public.my_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.company_members where user_id = auth.uid();
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.my_company_ids() from public;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.my_company_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Drop open policies
-- ---------------------------------------------------------------------------

drop policy if exists "cars_anon_all" on public.cars;
drop policy if exists "clients_anon_all" on public.clients;
drop policy if exists "rentals_anon_all" on public.rentals;
drop policy if exists "oil_change_records_anon_all" on public.oil_change_records;
drop policy if exists "cars_authenticated_all" on public.cars;
drop policy if exists "clients_authenticated_all" on public.clients;
drop policy if exists "rentals_authenticated_all" on public.rentals;
drop policy if exists "oil_change_records_authenticated_all" on public.oil_change_records;

drop policy if exists "payments_anon_all" on public.payments;
drop policy if exists "payments_authenticated_all" on public.payments;

drop policy if exists "platform_admins_select_own" on public.platform_admins;
drop policy if exists "companies_select_member_or_admin" on public.companies;
drop policy if exists "company_members_select_own_or_admin" on public.company_members;
drop policy if exists "cars_tenant_all" on public.cars;
drop policy if exists "clients_tenant_all" on public.clients;
drop policy if exists "rentals_tenant_all" on public.rentals;
drop policy if exists "oil_change_records_tenant_all" on public.oil_change_records;
drop policy if exists "payments_tenant_all" on public.payments;

-- ---------------------------------------------------------------------------
-- RLS: platform_admins, companies, company_members
-- ---------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.platform_admins enable row level security;

create policy "platform_admins_select_own"
  on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

create policy "companies_select_member_or_admin"
  on public.companies for select to authenticated
  using (
    public.is_platform_admin()
    or id in (select public.my_company_ids())
  );

create policy "company_members_select_own_or_admin"
  on public.company_members for select to authenticated
  using (
    public.is_platform_admin()
    or user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- RLS: tenant business tables
-- ---------------------------------------------------------------------------

create policy "cars_tenant_all"
  on public.cars for all to authenticated
  using (company_id in (select public.my_company_ids()))
  with check (company_id in (select public.my_company_ids()));

create policy "clients_tenant_all"
  on public.clients for all to authenticated
  using (company_id in (select public.my_company_ids()))
  with check (company_id in (select public.my_company_ids()));

create policy "rentals_tenant_all"
  on public.rentals for all to authenticated
  using (company_id in (select public.my_company_ids()))
  with check (company_id in (select public.my_company_ids()));

create policy "oil_change_records_tenant_all"
  on public.oil_change_records for all to authenticated
  using (company_id in (select public.my_company_ids()))
  with check (company_id in (select public.my_company_ids()));

create policy "payments_tenant_all"
  on public.payments for all to authenticated
  using (company_id in (select public.my_company_ids()))
  with check (company_id in (select public.my_company_ids()));

-- ---------------------------------------------------------------------------
-- AFTER this migration, link users (run separately in SQL Editor):
--
-- 1) Optional: rename the auto-created company
--    update public.companies
--    set name = 'Your Real Company Name', owner_email = 'owner@email.com'
--    where id = (select id from public.companies order by created_at limit 1);
--
-- 2) Create Auth users in Dashboard (platform admin + company owner).
--
-- 3) Platform admin:
--    insert into public.platform_admins (user_id) values ('<admin-user-uuid>');
--
-- 4) Link existing data's company to the owner login:
--    insert into public.company_members (company_id, user_id, role)
--    values (
--      (select id from public.companies order by created_at limit 1),
--      '<owner-user-uuid>',
--      'owner'
--    );
--
-- Do NOT create that same company again via the admin UI — it already exists.
-- ---------------------------------------------------------------------------
