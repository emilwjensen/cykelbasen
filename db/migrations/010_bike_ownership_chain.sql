create type public.bike_transfer_status as enum (
  'pending',
  'claimed',
  'cancelled',
  'expired'
);

create table public.bike_registry_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.garage_bikes
  add column registry_id uuid references public.bike_registry_records(id),
  add column ownership_ended_on date,
  add constraint garage_bikes_ownership_dates check (
    ownership_ended_on is null or ownership_ended_on >= acquired_on
  );

with registry_mapping as materialized (
  select id as bike_id, gen_random_uuid() as registry_id
  from public.garage_bikes
),
inserted as (
  insert into public.bike_registry_records (id)
  select registry_id from registry_mapping
)
update public.garage_bikes bike
set registry_id = mapping.registry_id
from registry_mapping mapping
where bike.id = mapping.bike_id;

alter table public.garage_bikes
  alter column registry_id set not null;

create table public.bike_ownership_periods (
  id uuid primary key default gen_random_uuid(),
  registry_id uuid not null
    references public.bike_registry_records(id) on delete cascade,
  garage_bike_id uuid not null unique
    references public.garage_bikes(id) on delete cascade,
  owner_id text not null references public.profiles(id) on delete restrict,
  owner_sequence smallint not null check (owner_sequence between 1 and 100),
  started_on date not null,
  ended_on date,
  created_at timestamptz not null default now(),
  unique (registry_id, owner_sequence),
  check (ended_on is null or ended_on >= started_on)
);

insert into public.bike_ownership_periods (
  registry_id,
  garage_bike_id,
  owner_id,
  owner_sequence,
  started_on,
  ended_on
)
select
  registry_id,
  id,
  owner_id,
  owner_count_at_acquisition,
  acquired_on,
  ownership_ended_on
from public.garage_bikes;

create unique index bike_ownership_periods_one_active_idx
  on public.bike_ownership_periods (registry_id)
  where ended_on is null;
create index bike_ownership_periods_registry_sequence_idx
  on public.bike_ownership_periods (registry_id, owner_sequence);

create table public.bike_transfer_invites (
  id uuid primary key default gen_random_uuid(),
  registry_id uuid not null
    references public.bike_registry_records(id) on delete cascade,
  from_garage_bike_id uuid not null
    references public.garage_bikes(id) on delete cascade,
  from_owner_id text not null references public.profiles(id) on delete restrict,
  token_hash text not null unique,
  status public.bike_transfer_status not null default 'pending',
  expires_at timestamptz not null,
  claimed_by text references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  constraint bike_transfer_claim_consistency check (
    (
      status in ('pending', 'cancelled', 'expired')
      and claimed_by is null
      and claimed_at is null
    )
    or
    (
      status = 'claimed'
      and claimed_by is not null
      and claimed_at is not null
    )
  )
);

create index bike_transfer_invites_owner_created_idx
  on public.bike_transfer_invites (from_owner_id, created_at desc);
create index bike_transfer_invites_pending_expiry_idx
  on public.bike_transfer_invites (expires_at)
  where status = 'pending';

alter table public.bike_registry_records enable row level security;
alter table public.bike_ownership_periods enable row level security;
alter table public.bike_transfer_invites enable row level security;

create policy bike_registry_participant_or_public_listing_read
on public.bike_registry_records for select
using (
  exists (
    select 1
    from public.garage_bikes bike
    where bike.registry_id = bike_registry_records.id
      and bike.owner_id = public.current_app_user_id()
  )
  or exists (
    select 1
    from public.listings listing
    join public.garage_bikes bike on bike.id = listing.garage_bike_id
    where bike.registry_id = bike_registry_records.id
      and listing.status in ('published', 'reserved', 'sold')
  )
);

create policy bike_ownership_participant_or_public_listing_read
on public.bike_ownership_periods for select
using (
  exists (
    select 1
    from public.garage_bikes bike
    where bike.registry_id = bike_ownership_periods.registry_id
      and bike.owner_id = public.current_app_user_id()
  )
  or exists (
    select 1
    from public.listings listing
    join public.garage_bikes bike on bike.id = listing.garage_bike_id
    where bike.registry_id = bike_ownership_periods.registry_id
      and listing.status in ('published', 'reserved', 'sold')
  )
);

create policy bike_transfer_invites_participant_read
on public.bike_transfer_invites for select
using (
  from_owner_id = public.current_app_user_id()
  or claimed_by = public.current_app_user_id()
);

create or replace function public.initialize_bike_registry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.registry_id is null then
    insert into public.bike_registry_records default values
    returning id into new.registry_id;
  end if;
  return new;
end;
$$;

create trigger garage_bikes_initialize_registry
before insert on public.garage_bikes
for each row execute function public.initialize_bike_registry();

create or replace function public.initialize_bike_ownership_period()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_sequence smallint;
begin
  select coalesce(max(owner_sequence), 0) + 1
  into next_sequence
  from public.bike_ownership_periods
  where registry_id = new.registry_id;

  insert into public.bike_ownership_periods (
    registry_id,
    garage_bike_id,
    owner_id,
    owner_sequence,
    started_on,
    ended_on
  )
  values (
    new.registry_id,
    new.id,
    new.owner_id,
    next_sequence,
    new.acquired_on,
    new.ownership_ended_on
  );

  return new;
end;
$$;

create trigger garage_bikes_initialize_ownership
after insert on public.garage_bikes
for each row execute function public.initialize_bike_ownership_period();

create or replace function public.protect_closed_bike_registration()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.ownership_ended_on is not null
     and public.current_app_user_id() = old.owner_id
  then
    raise exception 'En tidligere cykelregistrering kan ikke ændres';
  end if;
  return new;
end;
$$;

create trigger garage_bikes_protect_closed_registration
before update on public.garage_bikes
for each row execute function public.protect_closed_bike_registration();

drop policy bike_log_entries_owner_access on public.bike_log_entries;

create policy bike_log_entries_active_owner_access
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
      and bike.ownership_ended_on is null
  )
);

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
         and bike.ownership_ended_on is null
     )
  then
    raise exception 'En annonce kan kun forbindes med en aktiv cykelregistrering fra sælgeren';
  end if;

  return new;
end;
$$;

create or replace function public.create_bike_transfer_invite(
  target_bike_id uuid,
  transfer_token text
)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_registry_id uuid;
  invitation_expiry timestamptz := now() + interval '14 days';
begin
  if actor_id is null or char_length(transfer_token) < 24 then
    raise exception 'Ugyldig overdragelse';
  end if;

  select registry_id
  into target_registry_id
  from public.garage_bikes
  where id = target_bike_id
    and owner_id = actor_id
    and ownership_ended_on is null
  for update;

  if not found then
    raise exception 'Aktiv cykelregistrering blev ikke fundet';
  end if;

  update public.bike_transfer_invites
  set status = 'cancelled'
  where from_garage_bike_id = target_bike_id
    and status = 'pending';

  insert into public.bike_transfer_invites (
    registry_id,
    from_garage_bike_id,
    from_owner_id,
    token_hash,
    expires_at
  )
  values (
    target_registry_id,
    target_bike_id,
    actor_id,
    encode(digest(transfer_token, 'sha256'), 'hex'),
    invitation_expiry
  );

  return invitation_expiry;
end;
$$;

create or replace function public.accept_bike_transfer_invite(
  transfer_token text,
  buyer_acquired_on date,
  buyer_odometer_km integer
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  buyer_id text := public.current_app_user_id();
  invitation public.bike_transfer_invites%rowtype;
  source_bike public.garage_bikes%rowtype;
  new_bike_id uuid;
begin
  if buyer_id is null
     or transfer_token is null
     or buyer_acquired_on is null
     or buyer_acquired_on > current_date
     or buyer_odometer_km < 0
  then
    raise exception 'Ugyldige overtagelsesoplysninger';
  end if;

  select *
  into invitation
  from public.bike_transfer_invites
  where token_hash = encode(digest(transfer_token, 'sha256'), 'hex')
    and status = 'pending'
  for update;

  if not found or invitation.expires_at <= now() then
    raise exception 'Overdragelseskoden er ugyldig eller udløbet';
  end if;

  if invitation.from_owner_id = buyer_id then
    raise exception 'Du kan ikke overtage din egen cykel';
  end if;

  select *
  into source_bike
  from public.garage_bikes
  where id = invitation.from_garage_bike_id
    and owner_id = invitation.from_owner_id
    and ownership_ended_on is null
  for update;

  if not found then
    raise exception 'Cyklen er allerede overdraget';
  end if;

  if buyer_acquired_on < source_bike.acquired_on
     or buyer_odometer_km < source_bike.current_odometer_km
  then
    raise exception 'Dato eller kilometerstand kan ikke ligge før sælgerens historik';
  end if;

  update public.bike_ownership_periods
  set ended_on = buyer_acquired_on
  where garage_bike_id = source_bike.id
    and ended_on is null;

  update public.garage_bikes
  set ownership_ended_on = buyer_acquired_on
  where id = source_bike.id;

  insert into public.garage_bikes (
    registry_id,
    owner_id,
    nickname,
    category,
    brand,
    model,
    model_year,
    frame_size_label,
    acquired_on,
    acquired_used,
    owner_count_at_acquisition,
    current_odometer_km
  )
  values (
    source_bike.registry_id,
    buyer_id,
    source_bike.brand || ' ' || source_bike.model,
    source_bike.category,
    source_bike.brand,
    source_bike.model,
    source_bike.model_year,
    source_bike.frame_size_label,
    buyer_acquired_on,
    true,
    (
      select coalesce(max(owner_sequence), 0) + 1
      from public.bike_ownership_periods
      where registry_id = source_bike.registry_id
    ),
    buyer_odometer_km
  )
  returning id into new_bike_id;

  update public.bike_transfer_invites
  set
    status = case
      when id = invitation.id then 'claimed'::public.bike_transfer_status
      else 'cancelled'::public.bike_transfer_status
    end,
    claimed_by = case when id = invitation.id then buyer_id else null end,
    claimed_at = case when id = invitation.id then now() else null end
  where from_garage_bike_id = source_bike.id
    and status = 'pending';

  return new_bike_id;
end;
$$;

revoke all on function public.create_bike_transfer_invite(uuid, text)
  from public;
revoke all on function public.accept_bike_transfer_invite(text, date, integer)
  from public;
grant execute on function public.create_bike_transfer_invite(uuid, text)
  to cykelbasen_app;
grant execute on function public.accept_bike_transfer_invite(text, date, integer)
  to cykelbasen_app;

grant select on
  public.bike_registry_records,
  public.bike_ownership_periods,
  public.bike_transfer_invites
to cykelbasen_app;

grant usage on type public.bike_transfer_status to cykelbasen_app;
