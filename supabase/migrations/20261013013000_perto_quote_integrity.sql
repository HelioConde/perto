-- Perto quote integrity: one-step transitions and no self-directed quote requests.
-- Keep this migration scoped only to Perto in shared Supabase.

create or replace function public.perto_validate_new_request()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  canonical_city text;
  canonical_category text;
  professional_owner uuid;
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
  select p.city, p.category, p.user_id
    into canonical_city, canonical_category, professional_owner
  from public.perto_professionals p
  where p.id = new.professional_id and p.status = 'active';
  if not found then
    raise exception 'perto_professional_not_active' using errcode = '42501';
  end if;
  if professional_owner = new.user_id then
    raise exception 'perto_self_request_forbidden' using errcode = '42501';
  end if;
  new.city := canonical_city;
  new.category := canonical_category;
  new.status := 'new';
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

create or replace function public.perto_set_request_status(
  p_request_id uuid,
  p_new_status text
)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  old_state text;
  client_id uuid;
  professional_user_id uuid;
begin
  if actor is null or p_request_id is null then
    raise exception 'perto_request_access_denied' using errcode = '42501';
  end if;
  select r.status, r.user_id, p.user_id
    into old_state, client_id, professional_user_id
  from public.perto_requests r
  join public.perto_professionals p on p.id = r.professional_id
  where r.id = p_request_id
  for update of r;
  if not found or professional_user_id is distinct from actor or client_id = actor then
    raise exception 'perto_request_access_denied' using errcode = '42501';
  end if;
  if not (
    (old_state = 'new' and p_new_status = 'viewed')
    or (old_state = 'viewed' and p_new_status = 'contacted')
    or (old_state = 'contacted' and p_new_status = 'closed')
  ) then
    raise exception 'perto_request_invalid_transition' using errcode = '22023';
  end if;
  update public.perto_requests
  set status = p_new_status, updated_at = now()
  where id = p_request_id;
  return p_new_status;
end;
$$;

-- Do not expand EXECUTE grants accidentally while replacing these functions.
revoke all on function public.perto_set_request_status(uuid,text) from public, anon;
grant execute on function public.perto_set_request_status(uuid,text) to authenticated;
revoke all on function public.perto_validate_new_request() from public, anon, authenticated;
