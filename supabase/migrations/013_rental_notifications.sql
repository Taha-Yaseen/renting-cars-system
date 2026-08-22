-- Reminders attached to rentals.
-- Overdue is auto-managed (one system row per active rental with an end date).
-- Custom kinds are created by the user.

create table if not exists public.rental_notifications (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rentals (id) on delete cascade,
  kind text not null check (kind in (
    'overdue',
    'payment_due',
    'oil_change_due',
    'mechanic_fee_due',
    'other'
  )),
  due_date date not null,
  note text,
  is_system boolean not null default false,
  company_id uuid not null references public.companies (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint rental_notifications_system_kind_check
    check (is_system = (kind = 'overdue'))
);

create unique index if not exists rental_notifications_system_overdue_uidx
  on public.rental_notifications (rental_id)
  where is_system = true;

create index if not exists rental_notifications_company_id_idx
  on public.rental_notifications (company_id);

create index if not exists rental_notifications_rental_id_idx
  on public.rental_notifications (rental_id);

create index if not exists rental_notifications_due_date_idx
  on public.rental_notifications (due_date);

alter table public.rental_notifications enable row level security;

drop policy if exists "rental_notifications_tenant_all" on public.rental_notifications;

create policy "rental_notifications_tenant_all"
  on public.rental_notifications for all to authenticated
  using (company_id in (select public.my_company_ids()))
  with check (company_id in (select public.my_company_ids()));

insert into public.rental_notifications (rental_id, kind, due_date, is_system, company_id)
select id, 'overdue', end_date, true, company_id
from public.rentals
where end_date is not null
  and status in ('Active', 'Overdue');
