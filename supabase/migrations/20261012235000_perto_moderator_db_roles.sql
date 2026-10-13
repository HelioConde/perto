-- Trusted SQL Editor/backend moderators may approve profiles.
-- Authenticated browser users remain unable to change moderation status.
create or replace function public.perto_lock_moderation_status()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  trusted_moderator boolean :=
    current_user in ('postgres', 'supabase_admin', 'service_role');
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' and not trusted_moderator then
      raise exception 'professional_status_requires_moderation' using errcode = '42501';
    end if;
  elsif new.status is distinct from old.status and not trusted_moderator then
    raise exception 'professional_status_requires_moderation' using errcode = '42501';
  end if;
  return new;
end;
$$;
