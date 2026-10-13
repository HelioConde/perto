-- Perto: moderação obrigatória, pedidos privados e redução de exposição de contato.

alter table public.perto_requests
  add column if not exists contact text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='perto_professionals_status_check'
      and conrelid='public.perto_professionals'::regclass
  ) then
    alter table public.perto_professionals
      add constraint perto_professionals_status_check
      check (status in ('pending','active','paused','rejected'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='perto_requests_status_check'
      and conrelid='public.perto_requests'::regclass
  ) then
    alter table public.perto_requests
      add constraint perto_requests_status_check
      check (status in ('new','viewed','contacted','closed','cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='perto_requests_contact_check'
      and conrelid='public.perto_requests'::regclass
  ) then
    alter table public.perto_requests
      add constraint perto_requests_contact_check
      check (contact is null or char_length(trim(contact)) between 3 and 200);
  end if;
end $$;

create index if not exists perto_professionals_public_search_idx
  on public.perto_professionals(status, state, city, category);
drop policy if exists "perto_professionals_owner_insert" on public.perto_professionals;
create policy "perto_professionals_owner_insert"
on public.perto_professionals
for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');

create or replace function public.perto_lock_moderation_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  jwt_role text := coalesce((select auth.jwt()->>'role'), '');
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' and jwt_role <> 'service_role' then
      raise exception 'professional_status_requires_moderation' using errcode='42501';
    end if;
  elsif new.status is distinct from old.status and jwt_role <> 'service_role' then
    raise exception 'professional_status_requires_moderation' using errcode='42501';
  end if;
  return new;
end;
$$;

drop trigger if exists perto_lock_moderation_status_trigger on public.perto_professionals;
create trigger perto_lock_moderation_status_trigger
before insert or update on public.perto_professionals
for each row execute function public.perto_lock_moderation_status();

grant insert, update, delete on public.perto_professionals to authenticated;
grant select, insert, update, delete on public.perto_requests to authenticated;

revoke select on public.perto_professionals from anon, authenticated;
grant select (
  id, user_id, display_name, city, state, category, description,
  price_from_cents, rating, status, created_at, updated_at
) on public.perto_professionals to anon, authenticated;
