-- Perto: moderator-only API. No privileged key ever reaches the browser.
-- Moderator membership is assigned manually in the Supabase SQL editor.
create table if not exists public.perto_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.perto_moderators enable row level security;
revoke all on public.perto_moderators from public, anon, authenticated;

create table if not exists public.perto_moderation_events (
  id bigint generated always as identity primary key,
  professional_id uuid not null,
  moderator_id uuid not null references auth.users(id),
  old_status text not null,
  new_status text not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint perto_moderation_event_status_check
    check (new_status in ('active', 'rejected', 'paused')),
  constraint perto_moderation_event_reason_check
    check (reason is null or char_length(reason) <= 600)
);
create index if not exists perto_moderation_events_profile_created_idx
  on public.perto_moderation_events(professional_id, created_at desc);
alter table public.perto_moderation_events enable row level security;
revoke all on public.perto_moderation_events from public, anon, authenticated;

create or replace function public.perto_pending_moderation()
returns table (
  id uuid,
  display_name text,
  city text,
  state text,
  category text,
  description text,
  price_from_cents integer,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is null or not exists (
    select 1 from public.perto_moderators m
    where m.user_id = actor and m.is_active
  ) then
    raise exception 'perto_moderator_required' using errcode = '42501';
  end if;

  return query
    select p.id, p.display_name, p.city, p.state, p.category,
           p.description, p.price_from_cents, p.status, p.created_at
    from public.perto_professionals p
    where p.status = 'pending'
    order by p.updated_at asc
    limit 100;
end;
$$;

create or replace function public.perto_moderate_profile(
  p_professional_id uuid,
  p_decision text,
  p_reason text default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_status text;
  target_user_id uuid;
  cleaned_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if actor is null or not exists (
    select 1 from public.perto_moderators m
    where m.user_id = actor and m.is_active
  ) then
    raise exception 'perto_moderator_required' using errcode = '42501';
  end if;

  if p_decision is null or p_decision not in ('active', 'rejected', 'paused') then
    raise exception 'perto_invalid_decision' using errcode = '22023';
  end if;
  if cleaned_reason is not null and char_length(cleaned_reason) > 600 then
    raise exception 'perto_reason_too_long' using errcode = '22023';
  end if;
  if p_decision in ('rejected', 'paused')
     and char_length(coalesce(cleaned_reason, '')) < 8 then
    raise exception 'perto_reason_required' using errcode = '22023';
  end if;

  select p.status, p.user_id
  into previous_status, target_user_id
  from public.perto_professionals p
  where p.id = p_professional_id
  for update;
  if not found then
    raise exception 'perto_professional_not_found' using errcode = 'P0002';
  end if;
  if target_user_id = actor then
    raise exception 'perto_self_moderation_forbidden' using errcode = '42501';
  end if;
  if previous_status = p_decision then
    raise exception 'perto_moderation_no_change' using errcode = '22023';
  end if;

  update public.perto_professionals p
  set status = p_decision, updated_at = now()
  where p.id = p_professional_id;

  insert into public.perto_moderation_events
    (professional_id, moderator_id, old_status, new_status, reason)
  values
    (p_professional_id, actor, previous_status, p_decision, cleaned_reason);

  return p_decision;
end;
$$;

revoke all on function public.perto_pending_moderation() from public, anon;
revoke all on function public.perto_moderate_profile(uuid, text, text) from public, anon;
grant execute on function public.perto_pending_moderation() to authenticated;
grant execute on function public.perto_moderate_profile(uuid, text, text) to authenticated;
