create type public.bike_acquisition_source as enum (
  'dealer',
  'private-sale',
  'marketplace',
  'gift',
  'other'
);

create type public.bike_document_type as enum (
  'purchase-receipt',
  'sales-agreement',
  'service-receipt',
  'warranty',
  'insurance',
  'appraisal',
  'other'
);

alter table public.garage_bikes
  add column color text check (
    color is null or char_length(color) between 1 and 40
  ),
  add column frame_size_cm smallint check (
    frame_size_cm is null or frame_size_cm between 35 and 70
  ),
  add column material public.frame_material,
  add column groupset_brand text check (
    groupset_brand is null or char_length(groupset_brand) <= 60
  ),
  add column groupset_model text check (
    groupset_model is null or char_length(groupset_model) <= 80
  ),
  add column drivetrain text check (
    drivetrain is null or char_length(drivetrain) <= 20
  ),
  add column brakes public.brake_type,
  add column wheel_size text check (
    wheel_size is null or char_length(wheel_size) <= 30
  ),
  add column electronic_shifting boolean not null default false,
  add column acquisition_source public.bike_acquisition_source,
  add column purchase_price_dkk integer check (
    purchase_price_dkk is null
    or purchase_price_dkk between 0 and 1000000
  ),
  add column purchase_location text check (
    purchase_location is null or char_length(purchase_location) <= 120
  );

create table public.bike_documents (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.garage_bikes(id) on delete cascade,
  owner_id text not null references public.profiles(id) on delete cascade,
  document_type public.bike_document_type not null,
  title text not null check (char_length(title) between 2 and 120),
  document_date date check (
    document_date is null or document_date <= current_date
  ),
  object_key text not null unique,
  original_filename text not null check (
    char_length(original_filename) between 1 and 255
  ),
  content_type text not null check (
    content_type in (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    )
  ),
  size_bytes bigint not null check (
    size_bytes between 1 and 10485760
  ),
  created_at timestamptz not null default now()
);

create index bike_documents_bike_type_created_idx
  on public.bike_documents (bike_id, document_type, created_at desc);
create index garage_bikes_owner_active_specs_idx
  on public.garage_bikes (owner_id, ownership_ended_on, brand, model);

alter table public.bike_documents enable row level security;

create policy bike_documents_owner_read
on public.bike_documents for select
using (
  owner_id = public.current_app_user_id()
  and exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
  )
);

create policy bike_documents_active_owner_insert
on public.bike_documents for insert
with check (
  owner_id = public.current_app_user_id()
  and exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
      and bike.ownership_ended_on is null
  )
);

create policy bike_documents_active_owner_delete
on public.bike_documents for delete
using (
  owner_id = public.current_app_user_id()
  and exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
      and bike.ownership_ended_on is null
  )
);

create trigger bike_documents_rate_limit
before insert on public.bike_documents
for each row execute function public.enforce_write_rate_limit(
  'bike-document',
  '20',
  '86400'
);

revoke all on table public.bike_documents from cykelbasen_app;
grant select, insert, delete on table public.bike_documents
  to cykelbasen_app;

grant usage on type
  public.bike_acquisition_source,
  public.bike_document_type
to cykelbasen_app;
