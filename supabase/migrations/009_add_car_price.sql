-- Add purchase price to cars, used to track revenue recovery in car history.
alter table public.cars
  add column if not exists price numeric(10, 2) not null default 0 check (price >= 0);
