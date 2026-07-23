create or replace function public.can_read_bike_registry(
  candidate_registry_id uuid,
  candidate_user_id text default public.current_app_user_id()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1
      from public.garage_bikes bike
      where bike.registry_id = candidate_registry_id
        and bike.owner_id = candidate_user_id
    )
    or exists (
      select 1
      from public.listings listing
      join public.garage_bikes bike on bike.id = listing.garage_bike_id
      where bike.registry_id = candidate_registry_id
        and listing.status in ('published', 'reserved', 'sold')
    )
$$;

revoke all on function public.can_read_bike_registry(uuid, text) from public;
grant execute on function public.can_read_bike_registry(uuid, text)
  to cykelbasen_app;

drop policy bike_registry_participant_or_public_listing_read
  on public.bike_registry_records;
drop policy bike_ownership_participant_or_public_listing_read
  on public.bike_ownership_periods;

create policy bike_registry_participant_or_public_listing_read
on public.bike_registry_records for select
using (public.can_read_bike_registry(id));

create policy bike_ownership_participant_or_public_listing_read
on public.bike_ownership_periods for select
using (public.can_read_bike_registry(registry_id));
