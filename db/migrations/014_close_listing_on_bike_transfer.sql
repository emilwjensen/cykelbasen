create or replace function public.close_listing_on_bike_transfer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  with targets as materialized (
    select id, status
    from public.listings
    where garage_bike_id = new.id
      and status in ('published', 'reserved')
    for update
  ),
  updated as (
    update public.listings listing
    set status = 'sold'
    from targets
    where listing.id = targets.id
    returning listing.id
  )
  insert into public.listing_status_events (
    listing_id,
    actor_id,
    from_status,
    to_status
  )
  select
    targets.id,
    new.owner_id,
    targets.status,
    'sold'::public.listing_status
  from targets
  join updated on updated.id = targets.id;

  return new;
end;
$$;

create trigger garage_bikes_close_listing_on_transfer
after update of ownership_ended_on on public.garage_bikes
for each row
when (
  old.ownership_ended_on is null
  and new.ownership_ended_on is not null
)
execute function public.close_listing_on_bike_transfer();
