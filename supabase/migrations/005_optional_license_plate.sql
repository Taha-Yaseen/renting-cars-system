-- Allow cars without a license plate
alter table public.cars
  alter column license_plate drop not null;
