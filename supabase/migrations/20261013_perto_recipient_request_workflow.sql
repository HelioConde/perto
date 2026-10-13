-- Perto: allow the recipient professional to progress an incoming quote
-- while clients retain their existing cancellation-only RLS policy.
-- A SECURITY DEFINER RPC is required because clients may not UPDATE
-- someone else's request through the public table API.

create table if not exists public.perto_request_status_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.perto_requests(id) on delete cascade,
  actor_id uuid,
  previous_status text not null,
  new_status text not null,
  occurred_at timestamptz not null default now()
);
create index if not exists perto_request_events_request_idx
  on public.perto_request_status_events (request_id, occurred_at desc);
alter table public.perto_request_status_events enable row level security;
revoke all on public.perto_request_status_events from public, anon, authenticated;

create or replace function public.perto_audit_request_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.perto_request_status_events
      (request_id, actor_id, previous_status, new_status)
    values (new.id, (select auth.uid()), old.status, new.status);
  end if;
  return new;
end;
$$;
revoke all on function public.perto_audit_request_status() from public, anon, authenticated;

drop trigger if exists perto_audit_request_status_trigger on public.perto_requests;
create trigger perto_audit_request_status_trigger
after update of status on public.perto_requests
for each row execute function public.perto_audit_request_status();

create or replace function public.perto_set_request_status(
  p_request_id uuid,
  p_new_status text
)
returns text
language plpgsql
security definer
set search_path = ''
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

  -- Do not reveal if a guessed ID exists or belongs to somebody else.
  if not found or professional_user_id is distinct from actor
     or client_id = actor then
    raise exception 'perto_request_access_denied' using errcode = '42501';
  end if;

  if not (
     (old_state = 'new' and p_new_status in ('viewed', 'contacted'))
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
revoke all on function public.perto_set_request_status(uuid, text) from public, anon;
grant execute on function public.perto_set_request_status(uuid, text) to authenticated;
