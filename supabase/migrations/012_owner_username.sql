-- Prefer usernames over emails for company owners.
-- Safe if 011 already created owner_username, or an older 011 used owner_email.
-- Auth emails are synthetic: <username>@users.driverent.local

alter table public.companies
  add column if not exists owner_username text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'companies'
      and column_name = 'owner_email'
  ) then
    execute $sql$
      update public.companies
      set owner_username = case
        when owner_email is null or trim(owner_email) = '' then owner_username
        when position('@' in owner_email) > 0 then split_part(lower(owner_email), '@', 1)
        else lower(trim(owner_email))
      end
      where owner_username is null
    $sql$;
    execute 'alter table public.companies drop column owner_email';
  end if;
end $$;

create unique index if not exists companies_owner_username_unique
  on public.companies (owner_username)
  where owner_username is not null;
