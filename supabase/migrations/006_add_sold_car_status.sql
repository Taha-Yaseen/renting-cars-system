-- Allow Sold status on cars
alter table public.cars drop constraint if exists cars_status_check;

alter table public.cars
  add constraint cars_status_check
  check (status in ('Available', 'Rented', 'Maintenance', 'Sold'));
