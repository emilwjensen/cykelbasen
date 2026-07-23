create table public.listing_favorites (
  user_id text not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.listing_status_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  actor_id text not null references public.profiles(id) on delete restrict,
  from_status public.listing_status not null,
  to_status public.listing_status not null,
  created_at timestamptz not null default now(),
  check (from_status <> to_status)
);

create index listing_favorites_user_created_idx
  on public.listing_favorites (user_id, created_at desc);
create index listing_status_events_listing_created_idx
  on public.listing_status_events (listing_id, created_at desc);

alter table public.listing_favorites enable row level security;
alter table public.listing_status_events enable row level security;

create policy listing_favorites_owner_read
on public.listing_favorites for select
using (user_id = public.current_app_user_id());

create policy listing_favorites_owner_insert
on public.listing_favorites for insert
with check (
  user_id = public.current_app_user_id()
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.status = 'published'
  )
);

create policy listing_favorites_owner_delete
on public.listing_favorites for delete
using (user_id = public.current_app_user_id());

create policy listing_status_events_seller_or_moderator_read
on public.listing_status_events for select
using (
  public.is_moderator()
  or exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
  )
);

create or replace function public.protect_seller_listing_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  content_changed boolean;
begin
  if actor_id is null
     or actor_id <> old.seller_id
     or public.is_moderator(actor_id)
  then
    return new;
  end if;

  content_changed :=
    (to_jsonb(new) - array['status', 'updated_at'])
    is distinct from
    (to_jsonb(old) - array['status', 'updated_at']);

  if old.status in ('draft', 'rejected') then
    if new.status not in ('draft', 'pending_review') then
      raise exception 'Kladder kan kun sendes til kontrol';
    end if;
    return new;
  end if;

  if content_changed then
    raise exception 'En aktiv eller afsluttet annonce kan ikke redigeres';
  end if;

  if old.status = 'pending_review'
     and new.status not in ('pending_review', 'draft')
  then
    raise exception 'En annonce under kontrol kan kun trækkes tilbage';
  elsif old.status = 'published'
     and new.status not in ('published', 'reserved', 'sold', 'archived')
  then
    raise exception 'Ugyldig statusændring for en publiceret annonce';
  elsif old.status = 'reserved'
     and new.status not in ('reserved', 'published', 'sold', 'archived')
  then
    raise exception 'Ugyldig statusændring for en reserveret annonce';
  elsif old.status = 'sold'
     and new.status not in ('sold', 'archived')
  then
    raise exception 'En solgt annonce kan kun arkiveres';
  elsif old.status = 'archived' and new.status <> 'archived' then
    raise exception 'En arkiveret annonce kan ikke genåbnes';
  end if;

  return new;
end;
$$;

create trigger listings_protect_seller_update
before update on public.listings
for each row execute function public.protect_seller_listing_update();

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
  seller_id text;
  previous_status public.listing_status;
begin
  if actor_id is null then
    raise exception 'Log ind for at ændre annoncestatus';
  end if;

  if target_status not in ('sold', 'archived') then
    raise exception 'Ugyldig sælgerstatus';
  end if;

  select listing.seller_id, listing.status
  into seller_id, previous_status
  from public.listings listing
  where listing.id = target_listing_id
  for update;

  if not found or seller_id <> actor_id then
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

revoke all on function public.set_seller_listing_status(
  uuid,
  public.listing_status
) from public;
grant execute on function public.set_seller_listing_status(
  uuid,
  public.listing_status
) to cykelbasen_app;

grant select, insert, delete on public.listing_favorites to cykelbasen_app;
revoke update on public.listing_favorites from cykelbasen_app;

grant select on public.listing_status_events to cykelbasen_app;
revoke insert, update, delete on public.listing_status_events from cykelbasen_app;
