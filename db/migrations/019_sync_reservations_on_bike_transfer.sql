create index listings_marketplace_published_idx
  on public.listings (status, published_at desc, id)
  where status in ('published', 'reserved');
create index listings_marketplace_category_idx
  on public.listings (category, status, published_at desc, id)
  where status in ('published', 'reserved');
create index listings_marketplace_price_idx
  on public.listings (price_dkk, status, published_at desc, id)
  where status in ('published', 'reserved');

create or replace function public.close_listing_on_bike_transfer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target record;
begin
  for target in
    select listing.id, listing.status
    from public.listings listing
    where listing.garage_bike_id = new.id
      and listing.status in ('published', 'reserved')
    for update
  loop
    update public.contact_requests request
    set status = 'closed'
    where request.status in ('new', 'read')
      and exists (
        select 1
        from public.listing_reservations reservation
        where reservation.contact_request_id = request.id
          and reservation.listing_id = target.id
          and reservation.status = 'active'
      );

    update public.listing_reservations
    set
      status = 'completed',
      ended_by = new.owner_id,
      ended_at = now()
    where listing_id = target.id
      and status = 'active';

    update public.listings
    set status = 'sold'
    where id = target.id;

    insert into public.listing_status_events (
      listing_id,
      actor_id,
      from_status,
      to_status
    )
    values (
      target.id,
      new.owner_id,
      target.status,
      'sold'
    );
  end loop;

  return new;
end;
$$;
