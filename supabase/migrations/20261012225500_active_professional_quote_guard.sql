-- Perto: quote requests may only target an approved and active professional.
-- Only new inserts are restricted; past requests remain accessible to participants.
create policy perto_requests_active_professional_guard
on public.perto_requests
as restrictive
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and professional_id is not null
  and exists (
    select 1
    from public.perto_professionals as professional
    where professional.id = perto_requests.professional_id
      and professional.status = 'active'
  )
);
