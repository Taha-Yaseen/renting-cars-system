-- Oil change history per car (date + distance at time of change)

create table if not exists public.oil_change_records (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  date date not null,
  distance integer not null check (distance > 0),
  distance_unit text not null default 'km' check (distance_unit in ('km', 'mile')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists oil_change_records_car_id_idx on public.oil_change_records (car_id);

alter table public.oil_change_records enable row level security;

create policy "oil_change_records_anon_all" on public.oil_change_records for all to anon using (true) with check (true);
create policy "oil_change_records_authenticated_all" on public.oil_change_records for all to authenticated using (true) with check (true);
