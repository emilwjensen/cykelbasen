create type public.component_category as enum (
  'frame',
  'fork',
  'groupset',
  'crankset',
  'cassette',
  'chain',
  'brakes',
  'wheels',
  'tires',
  'cockpit',
  'saddle',
  'pedals',
  'other'
);

create type public.bike_log_type as enum (
  'ride',
  'maintenance',
  'component-change',
  'inspection',
  'note'
);

create table public.garage_bikes (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.profiles(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 80),
  category public.bike_category not null,
  brand text not null check (char_length(brand) between 1 and 60),
  model text not null check (char_length(model) between 1 and 80),
  model_year smallint check (model_year between 1950 and 2100),
  frame_size_label text check (
    frame_size_label is null or char_length(frame_size_label) between 1 and 20
  ),
  serial_number_hash text,
  acquired_on date not null check (acquired_on <= current_date),
  acquired_used boolean not null default false,
  owner_count_at_acquisition smallint not null default 1
    check (owner_count_at_acquisition between 1 and 20),
  current_odometer_km integer not null default 0
    check (current_odometer_km between 0 and 1000000),
  notes text check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bike_log_entries (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.garage_bikes(id) on delete cascade,
  log_type public.bike_log_type not null,
  title text not null check (char_length(title) between 3 and 120),
  details text check (details is null or char_length(details) <= 5000),
  occurred_on date not null check (occurred_on <= current_date),
  distance_km integer check (distance_km between 0 and 100000),
  odometer_km integer check (odometer_km between 0 and 1000000),
  cost_dkk integer check (cost_dkk between 0 and 1000000),
  component_category public.component_category,
  component_brand text check (
    component_brand is null or char_length(component_brand) <= 60
  ),
  component_model text check (
    component_model is null or char_length(component_model) <= 100
  ),
  documentation_available boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.listings
  add column purchase_date date,
  add column owner_count smallint not null default 1
    check (owner_count between 1 and 20),
  add column purchase_proof_available boolean not null default false,
  add column service_history_available boolean not null default false,
  add column garage_bike_id uuid references public.garage_bikes(id) on delete set null;

update public.listings
set purchase_date = make_date(
  least(coalesce(model_year, extract(year from current_date)::int - 2), extract(year from current_date)::int),
  1,
  1
)
where purchase_date is null;

alter table public.listings
  alter column purchase_date set not null,
  add constraint listings_purchase_date_not_future
    check (purchase_date <= current_date);

create table public.listing_component_changes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  category public.component_category not null,
  previous_component text check (
    previous_component is null or char_length(previous_component) <= 160
  ),
  replacement_brand text check (
    replacement_brand is null or char_length(replacement_brand) <= 60
  ),
  replacement_model text not null
    check (char_length(replacement_model) between 2 and 120),
  changed_on date check (changed_on is null or changed_on <= current_date),
  notes text check (notes is null or char_length(notes) <= 2000),
  documentation_available boolean not null default false,
  created_at timestamptz not null default now()
);

create index garage_bikes_owner_updated_idx
  on public.garage_bikes (owner_id, updated_at desc);
create index bike_log_entries_bike_occurred_idx
  on public.bike_log_entries (bike_id, occurred_on desc, created_at desc);
create index listing_component_changes_listing_idx
  on public.listing_component_changes (listing_id, changed_on desc nulls last);
create index listings_brand_published_idx
  on public.listings (brand, published_at desc)
  where status = 'published';

create trigger garage_bikes_set_updated_at
before update on public.garage_bikes
for each row execute function public.set_updated_at();

create or replace function public.validate_listing_garage_bike()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.garage_bike_id is not null
     and not exists (
       select 1
       from public.garage_bikes bike
       where bike.id = new.garage_bike_id
         and bike.owner_id = new.seller_id
     )
  then
    raise exception 'En annonce kan kun forbindes med en cykel fra sælgerens egen garage';
  end if;

  return new;
end;
$$;

create trigger listings_validate_garage_bike
before insert or update of garage_bike_id, seller_id on public.listings
for each row execute function public.validate_listing_garage_bike();

alter table public.garage_bikes enable row level security;
alter table public.bike_log_entries enable row level security;
alter table public.listing_component_changes enable row level security;

create policy garage_bikes_owner_access
on public.garage_bikes for all
using (owner_id = public.current_app_user_id())
with check (owner_id = public.current_app_user_id());

create policy bike_log_entries_owner_access
on public.bike_log_entries for all
using (
  exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
  )
)
with check (
  exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
  )
);

create policy listing_component_changes_public_or_owner_read
on public.listing_component_changes for select
using (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and (
        listing.status in ('published', 'reserved', 'sold')
        or listing.seller_id = public.current_app_user_id()
        or public.is_moderator()
      )
  )
);

create policy listing_component_changes_owner_write
on public.listing_component_changes for all
using (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
      and listing.status in ('draft', 'rejected')
  )
)
with check (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
      and listing.status in ('draft', 'rejected')
  )
);

grant select, insert, update, delete on
  public.garage_bikes,
  public.bike_log_entries,
  public.listing_component_changes
to cykelbasen_app;

grant usage on type
  public.component_category,
  public.bike_log_type
to cykelbasen_app;
