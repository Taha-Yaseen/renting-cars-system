-- Add purchase month/year to cars (run if 001 was applied before this change)

alter table public.cars
  add column if not exists purchase_month integer check (purchase_month >= 1 and purchase_month <= 12),
  add column if not exists purchase_year integer check (purchase_year >= 1900);
