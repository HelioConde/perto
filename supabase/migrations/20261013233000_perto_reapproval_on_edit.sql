-- Perto: approved professional details must be re-reviewed when changed.
-- A user may edit only whitelisted columns. Database sets status to pending.
-- Privileged SQL moderation roles still have explicit authority to approve/reject.
create or replace function public.perto_lock_moderation_status()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  trusted_moderator boolean := current_user in ('postgres','supabase_admin','service_role');
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' and not trusted_moderator then
      raise exception 'professional_status_requires_moderation' using errcode = '42501';
    end if;
  else
    -- A browser cannot explicitly change any moderation status.
    if new.status is distinct from old.status and not trusted_moderator then
      raise exception 'professional_status_requires_moderation' using errcode = '42501';
    end if;

    -- Changes to approved, paused or rejected listings require a new review.
    -- Trigger-generated status changes do not require browser UPDATE(status).
    if not trusted_moderator
       and old.status in ('active','paused','rejected')
       and row(new.display_name,new.city,new.state,new.category,
               new.description,new.price_from_cents)
           is distinct from
           row(old.display_name,old.city,old.state,old.category,
               old.description,old.price_from_cents) then
      new.status := 'pending';
    end if;
  end if;
  return new;
end;
$$;

-- The schema already has a unique(user_id) constraint and its index.
-- Remove the redundant duplicate index introduced by the first beta migration.
drop index if exists public.perto_professionals_unique_owner_idx;
