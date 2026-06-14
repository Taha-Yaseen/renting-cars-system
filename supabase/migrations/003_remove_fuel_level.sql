-- Remove fuel level from cars (run if 001 was applied before this change)

alter table public.cars drop column if exists fuel_level;
