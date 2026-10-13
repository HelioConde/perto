-- Perto controlled-beta least privilege (12 Oct 2026).
-- Table grants previously allowed anon UPDATE/INSERT despite RLS.
-- Deny write on moderation-only columns (status/rating/owner) on profiles;
-- quote requests are cancellable by requester but cannot be edited or forged.

revoke all privileges on table public.perto_professionals from public, anon, authenticated;
grant select (id, user_id, display_name, city, state, category, description,
  price_from_cents, rating, status, created_at, updated_at)
  on table public.perto_professionals to anon, authenticated;
grant insert (user_id, display_name, city, state, category, description,
  price_from_cents, updated_at)
  on table public.perto_professionals to authenticated;
grant update (display_name, city, state, category, description,
  price_from_cents, updated_at)
  on table public.perto_professionals to authenticated;

revoke all privileges on table public.perto_requests from public, anon, authenticated;
grant select on table public.perto_requests to authenticated;
grant insert (user_id, professional_id, category, city, message, contact)
  on table public.perto_requests to authenticated;
grant update (status, updated_at) on table public.perto_requests to authenticated;

alter policy perto_requests_owner_update on public.perto_requests
  to authenticated
  using (
    (select auth.uid()) = user_id
    and status in ('new', 'viewed', 'contacted')
  )
  with check (
    (select auth.uid()) = user_id
    and status = 'cancelled'
  );

-- The prior restrictive INSERT guard still requires an active professional.
-- Service-role backend remains able to moderate profiles.
