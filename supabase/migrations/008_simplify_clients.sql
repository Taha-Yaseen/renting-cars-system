-- Clients only need name and phone
alter table public.clients drop constraint if exists clients_drivers_license_key;
alter table public.clients drop column if exists email;
alter table public.clients drop column if exists drivers_license;
