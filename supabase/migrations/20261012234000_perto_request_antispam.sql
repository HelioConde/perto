-- Perto controlled beta: per-user anti-spam, canonical quote target, one profile.
-- New quote requests: max 5 per account per 60 minutes (atomic advisory lock).
-- Real IP-based limits/CAPTCHA remain a later integration requirement.

create unique index if not exists perto_professionals_unique_owner_idx
  on public.perto_professionals (user_id);

create or replace function public.perto_validate_new_request()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  canonical_city text;
  canonical_category text;
  recent_requests integer;
begin
  if new.user_id is distinct from (select auth.uid()) then
    raise exception 'perto_request_owner_mismatch' using errcode = '42501';
  end if;

  if length(btrim(coalesce(new.message, ''))) < 10
     or length(new.message) > 1600
     or length(btrim(coalesce(new.contact, ''))) < 3
     or length(new.contact) > 200 then
    raise exception 'perto_request_invalid_content' using errcode = '22023';
  end if;

  select city, category into canonical_city, canonical_category
  from public.perto_professionals
  where id = new.professional_id and status = 'active';

  if not found then
    raise exception 'perto_professional_not_active' using errcode = '42501';
  end if;

  new.city := canonical_city;
  new.category := canonical_category;
  new.status := 'new';

  -- Serialize simultaneous requests from this account to avoid quota races.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 48151623));

  select count(*) into recent_requests
  from public.perto_requests
  where user_id = new.user_id and created_at >= now() - interval '1 hour';

  if recent_requests >= 5 then
    raise exception 'perto_request_hourly_limit' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.perto_validate_new_request() from public, anon;
grant execute on function public.perto_validate_new_request() to authenticated;

drop trigger if exists perto_validate_new_request_trigger on public.perto_requests;
create trigger perto_validate_new_request_trigger
before insert on public.perto_requests
for each row execute function public.perto_validate_new_request();
