-- Allow open-ended rentals without a fixed end date
alter table public.rentals
  alter column end_date drop not null;

alter table public.rentals
  drop constraint if exists rentals_check;

alter table public.rentals
  drop constraint if exists rentals_end_date_check;

alter table public.rentals
  add constraint rentals_end_date_check
  check (end_date is null or end_date >= start_date);
