create or replace function public.get_public_listing_ownership_history(
  target_listing_id uuid
)
returns table (
  owner_sequence smallint,
  started_on date,
  ended_on date,
  is_current_listing_owner boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    period.owner_sequence,
    period.started_on,
    period.ended_on,
    period.garage_bike_id = listing.garage_bike_id
      as is_current_listing_owner
  from public.listings listing
  join public.garage_bikes bike on bike.id = listing.garage_bike_id
  join public.bike_ownership_periods period
    on period.registry_id = bike.registry_id
  where listing.id = target_listing_id
    and listing.status in ('published', 'reserved', 'sold')
  order by period.owner_sequence
$$;

revoke all on function public.get_public_listing_ownership_history(uuid)
  from public;
grant execute on function public.get_public_listing_ownership_history(uuid)
  to cykelbasen_app;
