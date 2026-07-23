create extension if not exists pgcrypto;

create type public.bike_category as enum (
  'road',
  'gravel',
  'cyclocross',
  'triathlon',
  'vintage',
  'electric-road'
);

create type public.listing_condition as enum (
  'like-new',
  'excellent',
  'good',
  'used'
);

create type public.frame_material as enum (
  'carbon',
  'aluminium',
  'steel',
  'titanium',
  'other'
);

create type public.brake_type as enum (
  'disc-hydraulic',
  'disc-mechanical',
  'rim',
  'other'
);

create type public.listing_status as enum (
  'draft',
  'pending_review',
  'rejected',
  'published',
  'reserved',
  'sold',
  'archived'
);

create type public.document_status as enum (
  'pending',
  'approved',
  'rejected'
);

create table public.profiles (
  id text primary key,
  display_name text not null check (char_length(display_name) between 2 and 60),
  city text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderators (
  user_id text primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id text not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 8 and 100),
  category public.bike_category not null,
  brand text not null check (char_length(brand) between 1 and 60),
  model text not null check (char_length(model) between 1 and 80),
  model_year smallint check (model_year between 1950 and 2100),
  frame_size_label text not null check (char_length(frame_size_label) between 1 and 20),
  frame_size_cm numeric(4,1) check (frame_size_cm between 35 and 75),
  material public.frame_material,
  groupset_brand text,
  groupset_model text,
  drivetrain text,
  brakes public.brake_type,
  wheel_size text,
  electronic_shifting boolean not null default false,
  shipping_offered boolean not null default false,
  price_dkk integer not null check (price_dkk between 1 and 1000000),
  condition public.listing_condition not null,
  city text not null check (char_length(city) between 2 and 80),
  description text not null check (char_length(description) between 20 and 5000),
  status public.listing_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(brand, '') || ' ' ||
      coalesce(model, '') || ' ' || coalesce(city, '')
    )
  ) stored,
  constraint listing_publication_date check (
    (status in ('published', 'reserved', 'sold', 'archived') and published_at is not null)
    or
    (status in ('draft', 'pending_review', 'rejected'))
  )
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  object_key text not null unique,
  image_url text not null,
  alt_text text not null,
  position smallint not null check (position between 0 and 20),
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

create table public.ownership_documents (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id text not null references public.profiles(id) on delete restrict,
  object_key text not null unique,
  frame_number_hash text,
  status public.document_status not null default 'pending',
  review_note text,
  reviewed_by text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint document_review_consistency check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or
    (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);

create index listings_published_at_idx
  on public.listings (published_at desc)
  where status = 'published';
create index listings_category_published_idx
  on public.listings (category, published_at desc)
  where status = 'published';
create index listings_price_idx
  on public.listings (price_dkk)
  where status = 'published';
create index listings_size_idx
  on public.listings (frame_size_cm, frame_size_label)
  where status = 'published';
create index listings_material_idx
  on public.listings (material)
  where status = 'published';
create index listings_brakes_idx
  on public.listings (brakes)
  where status = 'published';
create index listings_condition_idx
  on public.listings (condition)
  where status = 'published';
create index listings_city_idx
  on public.listings (city)
  where status = 'published';
create index listings_search_idx on public.listings using gin (search_vector);
create index listing_images_listing_position_idx
  on public.listing_images (listing_id, position);
create index ownership_documents_listing_status_idx
  on public.ownership_documents (listing_id, status);

create or replace function public.current_app_user_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')
$$;

create or replace function public.is_moderator(candidate_user_id text default public.current_app_user_id())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.moderators
    where user_id = candidate_user_id
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create or replace function public.require_approved_ownership()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published'
     and not exists (
       select 1
       from public.ownership_documents document
       where document.listing_id = new.id
         and document.owner_id = new.seller_id
         and document.status = 'approved'
     )
  then
    raise exception 'En annonce kan ikke publiceres uden godkendt ejerskabsdokumentation';
  end if;

  return new;
end;
$$;

create constraint trigger listings_require_approved_ownership
after insert or update of status on public.listings
deferrable initially deferred
for each row execute function public.require_approved_ownership();

alter table public.profiles enable row level security;
alter table public.moderators enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.ownership_documents enable row level security;

create policy profiles_public_read
on public.profiles for select
using (true);

create policy profiles_owner_write
on public.profiles for all
using (id = public.current_app_user_id())
with check (id = public.current_app_user_id());

create policy listings_public_or_owner_read
on public.listings for select
using (
  status in ('published', 'reserved', 'sold')
  or seller_id = public.current_app_user_id()
  or public.is_moderator()
);

create policy listings_owner_insert
on public.listings for insert
with check (seller_id = public.current_app_user_id());

create policy listings_owner_or_moderator_update
on public.listings for update
using (seller_id = public.current_app_user_id() or public.is_moderator())
with check (seller_id = public.current_app_user_id() or public.is_moderator());

create policy listings_owner_or_moderator_delete
on public.listings for delete
using (seller_id = public.current_app_user_id() or public.is_moderator());

create policy listing_images_public_or_owner_read
on public.listing_images for select
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

create policy listing_images_owner_write
on public.listing_images for all
using (
  exists (
    select 1 from public.listings
    where id = listing_id
      and (seller_id = public.current_app_user_id() or public.is_moderator())
  )
)
with check (
  exists (
    select 1 from public.listings
    where id = listing_id
      and (seller_id = public.current_app_user_id() or public.is_moderator())
  )
);

create policy ownership_documents_owner_or_moderator_read
on public.ownership_documents for select
using (owner_id = public.current_app_user_id() or public.is_moderator());

create policy ownership_documents_owner_insert
on public.ownership_documents for insert
with check (
  owner_id = public.current_app_user_id()
  and status = 'pending'
  and exists (
    select 1 from public.listings
    where id = listing_id and seller_id = public.current_app_user_id()
  )
);

create policy ownership_documents_moderator_update
on public.ownership_documents for update
using (public.is_moderator())
with check (public.is_moderator());

comment on function public.current_app_user_id is
  'Phase 2 auth bridge. Authenticated server transactions must SET LOCAL app.user_id before querying with the restricted application role.';

