-- DriveRent schema for Supabase
-- Run in Supabase Dashboard → SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year integer not null check (year >= 1900),
  license_plate text not null unique,
  daily_rate numeric(10, 2) not null check (daily_rate > 0),
  status text not null check (status in ('Available', 'Rented', 'Maintenance', 'Sold')),
  purchase_month integer check (purchase_month >= 1 and purchase_month <= 12),
  purchase_year integer check (purchase_year >= 1900),
  color text check (color in (
    'white', 'black', 'silver', 'gray', 'red', 'blue', 'navy', 'green',
    'brown', 'beige', 'gold', 'orange', 'yellow', 'burgundy', 'purple'
  )),
  mechanic_fee_due_date date,
  oil_change_due_km integer check (oil_change_due_km > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  drivers_license text not null unique,
  status text not null check (status in ('Active', 'Suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete restrict,
  client_id uuid not null references public.clients (id) on delete restrict,
  start_date date not null,
  end_date date not null,
  total_cost numeric(10, 2) not null check (total_cost >= 0),
  daily_rate numeric(10, 2) not null check (daily_rate > 0),
  status text not null check (status in ('Active', 'Completed', 'Overdue')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists rentals_car_id_idx on public.rentals (car_id);
create index if not exists rentals_client_id_idx on public.rentals (client_id);
create index if not exists rentals_status_idx on public.rentals (status);

alter table public.cars enable row level security;
alter table public.clients enable row level security;
alter table public.rentals enable row level security;

-- Development policies: allow the anon key full access.
-- Replace with auth-based policies before production.
create policy "cars_anon_all" on public.cars for all to anon using (true) with check (true);
create policy "clients_anon_all" on public.clients for all to anon using (true) with check (true);
create policy "rentals_anon_all" on public.rentals for all to anon using (true) with check (true);

create policy "cars_authenticated_all" on public.cars for all to authenticated using (true) with check (true);
create policy "clients_authenticated_all" on public.clients for all to authenticated using (true) with check (true);
create policy "rentals_authenticated_all" on public.rentals for all to authenticated using (true) with check (true);
