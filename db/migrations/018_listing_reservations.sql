create type public.listing_reservation_status as enum (
  'active',
  'cancelled',
  'completed'
);

create table public.listing_reservations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  contact_request_id uuid not null
    references public.contact_requests(id) on delete cascade,
  seller_id text not null references public.profiles(id) on delete restrict,
  buyer_id text not null references public.profiles(id) on delete restrict,
  status public.listing_reservation_status not null default 'active',
  ended_by text references public.profiles(id) on delete set null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint listing_reservation_parties_differ
    check (seller_id <> buyer_id),
  constraint listing_reservation_end_consistency check (
    (status = 'active' and ended_by is null and ended_at is null)
    or
    (status in ('cancelled', 'completed')
      and ended_by is not null
      and ended_at is not null)
  )
);

create unique index listing_reservations_one_active_listing_idx
  on public.listing_reservations (listing_id)
  where status = 'active';
create index listing_reservations_contact_created_idx
  on public.listing_reservations (contact_request_id, created_at desc);
create index listing_reservations_seller_status_created_idx
  on public.listing_reservations (seller_id, status, created_at desc);
create index listing_reservations_buyer_status_created_idx
  on public.listing_reservations (buyer_id, status, created_at desc);

alter table public.listing_reservations enable row level security;

create policy listing_reservations_participant_or_moderator_read
on public.listing_reservations for select
using (
  seller_id = public.current_app_user_id()
  or buyer_id = public.current_app_user_id()
  or public.is_moderator()
);

create or replace function public.reserve_listing_for_contact(
  target_contact_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_listing_id uuid;
  target_seller_id text;
  target_buyer_id text;
  request_status public.contact_request_status;
  listing_status public.listing_status;
  reservation_id uuid;
begin
  if actor_id is null then
    raise exception 'Log ind for at reservere annoncen';
  end if;

  select
    request.listing_id,
    request.seller_id,
    request.buyer_id,
    request.status,
    listing.status
  into
    target_listing_id,
    target_seller_id,
    target_buyer_id,
    request_status,
    listing_status
  from public.contact_requests request
  join public.listings listing on listing.id = request.listing_id
  where request.id = target_contact_request_id
    and request.seller_id = listing.seller_id
  for update of request, listing;

  if not found or target_seller_id <> actor_id then
    return null;
  end if;

  if request_status = 'closed' or listing_status <> 'published' then
    return null;
  end if;

  insert into public.listing_reservations (
    listing_id,
    contact_request_id,
    seller_id,
    buyer_id
  )
  values (
    target_listing_id,
    target_contact_request_id,
    target_seller_id,
    target_buyer_id
  )
  returning id into reservation_id;

  update public.contact_requests
  set status = 'read'
  where id = target_contact_request_id
    and status = 'new';

  update public.listings
  set status = 'reserved'
  where id = target_listing_id;

  insert into public.listing_status_events (
    listing_id,
    actor_id,
    from_status,
    to_status
  )
  values (
    target_listing_id,
    actor_id,
    'published',
    'reserved'
  );

  return reservation_id;
end;
$$;

create or replace function public.cancel_listing_reservation(
  target_reservation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_listing_id uuid;
  target_seller_id text;
  target_buyer_id text;
  listing_status public.listing_status;
begin
  if actor_id is null then
    raise exception 'Log ind for at frigive reservationen';
  end if;

  select
    reservation.listing_id,
    reservation.seller_id,
    reservation.buyer_id,
    listing.status
  into
    target_listing_id,
    target_seller_id,
    target_buyer_id,
    listing_status
  from public.listing_reservations reservation
  join public.listings listing on listing.id = reservation.listing_id
  where reservation.id = target_reservation_id
    and reservation.status = 'active'
  for update of reservation, listing;

  if not found or actor_id not in (target_seller_id, target_buyer_id) then
    return false;
  end if;

  update public.listing_reservations
  set
    status = 'cancelled',
    ended_by = actor_id,
    ended_at = now()
  where id = target_reservation_id;

  if listing_status = 'reserved' then
    update public.listings
    set status = 'published'
    where id = target_listing_id;

    insert into public.listing_status_events (
      listing_id,
      actor_id,
      from_status,
      to_status
    )
    values (
      target_listing_id,
      actor_id,
      'reserved',
      'published'
    );
  end if;

  return true;
end;
$$;

create or replace function public.set_seller_listing_status(
  target_listing_id uuid,
  target_status public.listing_status
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_seller_id text;
  previous_status public.listing_status;
begin
  if actor_id is null then
    raise exception 'Log ind for at ændre annoncestatus';
  end if;

  if target_status not in ('sold', 'archived') then
    raise exception 'Ugyldig sælgerstatus';
  end if;

  select listing.seller_id, listing.status
  into target_seller_id, previous_status
  from public.listings listing
  where listing.id = target_listing_id
  for update;

  if not found or target_seller_id <> actor_id then
    return false;
  end if;

  if target_status = 'sold'
     and previous_status not in ('published', 'reserved')
  then
    return false;
  end if;

  if target_status = 'archived'
     and previous_status not in ('published', 'reserved', 'sold')
  then
    return false;
  end if;

  update public.contact_requests request
  set status = 'closed'
  where request.status in ('new', 'read')
    and exists (
      select 1
      from public.listing_reservations reservation
      where reservation.contact_request_id = request.id
        and reservation.listing_id = target_listing_id
        and reservation.status = 'active'
    );

  update public.listing_reservations
  set
    status = case
      when target_status = 'sold'
        then 'completed'::public.listing_reservation_status
      else 'cancelled'::public.listing_reservation_status
    end,
    ended_by = actor_id,
    ended_at = now()
  where listing_id = target_listing_id
    and status = 'active';

  update public.listings
  set status = target_status
  where id = target_listing_id;

  insert into public.listing_status_events (
    listing_id,
    actor_id,
    from_status,
    to_status
  )
  values (
    target_listing_id,
    actor_id,
    previous_status,
    target_status
  );

  return true;
end;
$$;

create or replace function public.protect_seller_listing_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  content_changed boolean;
begin
  if current_user <> 'cykelbasen_app' then
    return new;
  end if;

  if actor_id is null then
    raise exception 'Log ind for at ændre annoncen';
  end if;

  if public.is_moderator(actor_id) then
    raise exception 'Moderatorændringer skal bruge den auditerede funktion';
  end if;

  if actor_id <> old.seller_id then
    return new;
  end if;

  content_changed :=
    (to_jsonb(new) - array['status', 'updated_at', 'search_vector'])
    is distinct from
    (to_jsonb(old) - array['status', 'updated_at', 'search_vector']);

  if old.status = 'draft' then
    if new.status <> 'draft' then
      raise exception 'Brug indsendelsesfunktionen til at ændre status';
    end if;
    return new;
  end if;

  if old.status = 'rejected' then
    if new.status not in ('rejected', 'draft') then
      raise exception 'Brug indsendelsesfunktionen til at ændre status';
    end if;
    return new;
  end if;

  if content_changed then
    raise exception 'En aktiv eller afsluttet annonce kan ikke redigeres';
  end if;

  if new.status <> old.status then
    raise exception 'Brug lifecycle-funktionen til at ændre status';
  end if;

  return new;
end;
$$;

drop policy if exists listing_favorites_owner_insert
  on public.listing_favorites;
create policy listing_favorites_owner_insert
on public.listing_favorites for insert
with check (
  user_id = public.current_app_user_id()
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.status in ('published', 'reserved')
  )
);

revoke all on table public.listing_reservations from cykelbasen_app;
grant select on table public.listing_reservations to cykelbasen_app;
revoke delete on public.listings from cykelbasen_app;

revoke all on function public.reserve_listing_for_contact(uuid) from public;
revoke all on function public.cancel_listing_reservation(uuid) from public;
grant execute on function public.reserve_listing_for_contact(uuid)
  to cykelbasen_app;
grant execute on function public.cancel_listing_reservation(uuid)
  to cykelbasen_app;
grant usage on type public.listing_reservation_status to cykelbasen_app;
