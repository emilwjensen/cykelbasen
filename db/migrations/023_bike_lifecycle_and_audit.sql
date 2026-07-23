create type public.bike_retirement_reason as enum (
  'worn-out',
  'crashed',
  'stolen',
  'lost',
  'other'
);

alter table public.garage_bikes
  add column retired_on date,
  add column retirement_reason public.bike_retirement_reason,
  add column retirement_note text check (
    retirement_note is null or char_length(retirement_note) <= 1000
  ),
  add constraint garage_bike_retirement_consistency check (
    (
      retired_on is null
      and retirement_reason is null
      and retirement_note is null
    )
    or (
      retired_on is not null
      and retirement_reason is not null
      and retired_on >= acquired_on
      and retired_on <= current_date
    )
  );

create table public.bike_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.garage_bikes(id) on delete cascade,
  owner_id text not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('retired', 'reactivated')),
  reason text,
  occurred_on date not null,
  created_at timestamptz not null default now()
);

alter table public.bike_log_entries
  add column updated_at timestamptz not null default now(),
  add column voided_at timestamptz,
  add column void_reason text check (
    void_reason is null or char_length(void_reason) between 3 and 500
  ),
  add constraint bike_log_void_consistency check (
    (voided_at is null and void_reason is null)
    or (voided_at is not null and void_reason is not null)
  );

create table public.bike_log_revisions (
  id uuid primary key default gen_random_uuid(),
  log_entry_id uuid not null
    references public.bike_log_entries(id) on delete restrict,
  bike_id uuid not null references public.garage_bikes(id) on delete cascade,
  owner_id text not null references public.profiles(id) on delete cascade,
  revision_type text not null check (
    revision_type in ('corrected', 'voided')
  ),
  correction_reason text not null check (
    char_length(correction_reason) between 3 and 500
  ),
  before_data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.bike_maintenance_reminders
  add column updated_at timestamptz not null default now(),
  add column cancelled_at timestamptz,
  add column cancel_reason text check (
    cancel_reason is null or char_length(cancel_reason) between 3 and 500
  ),
  add constraint bike_reminder_cancel_consistency check (
    (cancelled_at is null and cancel_reason is null)
    or (cancelled_at is not null and cancel_reason is not null)
  );

create table public.bike_reminder_revisions (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null
    references public.bike_maintenance_reminders(id) on delete restrict,
  bike_id uuid not null references public.garage_bikes(id) on delete cascade,
  owner_id text not null references public.profiles(id) on delete cascade,
  revision_type text not null check (
    revision_type in ('edited', 'snoozed', 'cancelled')
  ),
  change_reason text not null check (
    char_length(change_reason) between 3 and 500
  ),
  before_data jsonb not null,
  created_at timestamptz not null default now()
);

create index bike_lifecycle_events_bike_created_idx
  on public.bike_lifecycle_events (bike_id, created_at desc);
create index bike_log_revisions_log_created_idx
  on public.bike_log_revisions (log_entry_id, created_at desc);
create index bike_reminder_revisions_reminder_created_idx
  on public.bike_reminder_revisions (reminder_id, created_at desc);
create index garage_bikes_owner_retired_idx
  on public.garage_bikes (owner_id, retired_on, updated_at desc);

alter table public.bike_lifecycle_events enable row level security;
alter table public.bike_log_revisions enable row level security;
alter table public.bike_reminder_revisions enable row level security;

create policy bike_lifecycle_events_owner_read
on public.bike_lifecycle_events for select
using (owner_id = public.current_app_user_id());

create policy bike_log_revisions_owner_read
on public.bike_log_revisions for select
using (owner_id = public.current_app_user_id());

create policy bike_reminder_revisions_owner_read
on public.bike_reminder_revisions for select
using (owner_id = public.current_app_user_id());

drop policy bike_log_entries_active_owner_access on public.bike_log_entries;

create policy bike_log_entries_owner_read
on public.bike_log_entries for select
using (
  exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
  )
);

create policy bike_log_entries_active_owner_insert
on public.bike_log_entries for insert
with check (
  exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
      and bike.ownership_ended_on is null
      and bike.retired_on is null
  )
);

create or replace function public.retire_garage_bike(
  target_bike_id uuid,
  retired_date date,
  reason public.bike_retirement_reason,
  note text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
begin
  update public.garage_bikes
  set
    retired_on = retired_date,
    retirement_reason = reason,
    retirement_note = nullif(btrim(note), '')
  where id = target_bike_id
    and owner_id = actor_id
    and ownership_ended_on is null
    and retired_on is null;

  if not found then
    return false;
  end if;

  insert into public.bike_lifecycle_events (
    bike_id, owner_id, event_type, reason, occurred_on
  )
  values (
    target_bike_id, actor_id, 'retired',
    reason::text || coalesce(': ' || nullif(btrim(note), ''), ''),
    retired_date
  );
  return true;
end;
$$;

create or replace function public.reactivate_garage_bike(
  target_bike_id uuid,
  change_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
begin
  if char_length(btrim(change_reason)) < 3 then
    raise exception 'Angiv hvorfor cyklen genaktiveres';
  end if;

  update public.garage_bikes
  set
    retired_on = null,
    retirement_reason = null,
    retirement_note = null
  where id = target_bike_id
    and owner_id = actor_id
    and ownership_ended_on is null
    and retired_on is not null;

  if not found then
    return false;
  end if;

  insert into public.bike_lifecycle_events (
    bike_id, owner_id, event_type, reason, occurred_on
  )
  values (
    target_bike_id, actor_id, 'reactivated',
    btrim(change_reason), current_date
  );
  return true;
end;
$$;

create or replace function public.correct_bike_log_entry(
  target_log_id uuid,
  new_log_type public.bike_log_type,
  new_title text,
  new_details text,
  new_occurred_on date,
  new_distance_km integer,
  new_odometer_km integer,
  new_cost_dkk integer,
  new_component_category public.component_category,
  new_component_brand text,
  new_component_model text,
  new_documentation_available boolean,
  correction_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_log public.bike_log_entries%rowtype;
begin
  if char_length(btrim(correction_reason)) < 3 then
    raise exception 'Angiv en rettelsesgrund';
  end if;

  select log.*
  into target_log
  from public.bike_log_entries log
  join public.garage_bikes bike on bike.id = log.bike_id
  where log.id = target_log_id
    and bike.owner_id = actor_id
    and bike.ownership_ended_on is null
    and bike.retired_on is null
    and log.voided_at is null
  for update of log, bike;

  if not found then
    return false;
  end if;

  insert into public.bike_log_revisions (
    log_entry_id, bike_id, owner_id, revision_type,
    correction_reason, before_data
  )
  values (
    target_log.id, target_log.bike_id, actor_id, 'corrected',
    btrim(correction_reason), to_jsonb(target_log)
  );

  update public.bike_log_entries
  set
    log_type = new_log_type,
    title = new_title,
    details = nullif(btrim(new_details), ''),
    occurred_on = new_occurred_on,
    distance_km = new_distance_km,
    odometer_km = new_odometer_km,
    cost_dkk = new_cost_dkk,
    component_category = new_component_category,
    component_brand = nullif(btrim(new_component_brand), ''),
    component_model = nullif(btrim(new_component_model), ''),
    documentation_available = new_documentation_available,
    updated_at = now()
  where id = target_log_id;

  return true;
end;
$$;

create or replace function public.void_bike_log_entry(
  target_log_id uuid,
  correction_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_log public.bike_log_entries%rowtype;
begin
  select log.*
  into target_log
  from public.bike_log_entries log
  join public.garage_bikes bike on bike.id = log.bike_id
  where log.id = target_log_id
    and bike.owner_id = actor_id
    and bike.ownership_ended_on is null
    and bike.retired_on is null
    and log.voided_at is null
  for update of log, bike;

  if not found or char_length(btrim(correction_reason)) < 3 then
    return false;
  end if;

  insert into public.bike_log_revisions (
    log_entry_id, bike_id, owner_id, revision_type,
    correction_reason, before_data
  )
  values (
    target_log.id, target_log.bike_id, actor_id, 'voided',
    btrim(correction_reason), to_jsonb(target_log)
  );

  update public.bike_log_entries
  set
    voided_at = now(),
    void_reason = btrim(correction_reason),
    updated_at = now()
  where id = target_log_id;
  return true;
end;
$$;

create or replace function public.update_bike_maintenance_reminder(
  target_reminder_id uuid,
  new_title text,
  new_component_category public.component_category,
  new_due_on date,
  new_due_odometer_km integer,
  new_notes text,
  change_reason text,
  revision_kind text default 'edited'
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_reminder public.bike_maintenance_reminders%rowtype;
begin
  if new_due_on is null and new_due_odometer_km is null then
    raise exception 'En påmindelse kræver en deadline';
  end if;
  if char_length(btrim(change_reason)) < 3
     or revision_kind not in ('edited', 'snoozed') then
    raise exception 'Ugyldig ændring';
  end if;

  select reminder.*
  into target_reminder
  from public.bike_maintenance_reminders reminder
  join public.garage_bikes bike on bike.id = reminder.bike_id
  where reminder.id = target_reminder_id
    and reminder.owner_id = actor_id
    and reminder.completed_at is null
    and reminder.cancelled_at is null
    and bike.owner_id = actor_id
    and bike.ownership_ended_on is null
    and bike.retired_on is null
  for update of reminder, bike;

  if not found then
    return false;
  end if;

  insert into public.bike_reminder_revisions (
    reminder_id, bike_id, owner_id, revision_type,
    change_reason, before_data
  )
  values (
    target_reminder.id, target_reminder.bike_id, actor_id, revision_kind,
    btrim(change_reason), to_jsonb(target_reminder)
  );

  update public.bike_maintenance_reminders
  set
    title = new_title,
    component_category = new_component_category,
    due_on = new_due_on,
    due_odometer_km = new_due_odometer_km,
    notes = nullif(btrim(new_notes), ''),
    updated_at = now()
  where id = target_reminder_id;
  return true;
end;
$$;

create or replace function public.cancel_bike_maintenance_reminder(
  target_reminder_id uuid,
  change_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_reminder public.bike_maintenance_reminders%rowtype;
begin
  select reminder.*
  into target_reminder
  from public.bike_maintenance_reminders reminder
  join public.garage_bikes bike on bike.id = reminder.bike_id
  where reminder.id = target_reminder_id
    and reminder.owner_id = actor_id
    and reminder.completed_at is null
    and reminder.cancelled_at is null
    and bike.owner_id = actor_id
    and bike.ownership_ended_on is null
  for update of reminder, bike;

  if not found or char_length(btrim(change_reason)) < 3 then
    return false;
  end if;

  insert into public.bike_reminder_revisions (
    reminder_id, bike_id, owner_id, revision_type,
    change_reason, before_data
  )
  values (
    target_reminder.id, target_reminder.bike_id, actor_id, 'cancelled',
    btrim(change_reason), to_jsonb(target_reminder)
  );

  update public.bike_maintenance_reminders
  set
    cancelled_at = now(),
    cancel_reason = btrim(change_reason),
    updated_at = now()
  where id = target_reminder_id;
  return true;
end;
$$;

create or replace function public.snooze_bike_maintenance_reminder(
  target_reminder_id uuid,
  days_to_snooze integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_reminder public.bike_maintenance_reminders%rowtype;
begin
  if days_to_snooze not between 1 and 365 then
    raise exception 'Ugyldig udsættelse';
  end if;

  select reminder.*
  into target_reminder
  from public.bike_maintenance_reminders reminder
  join public.garage_bikes bike on bike.id = reminder.bike_id
  where reminder.id = target_reminder_id
    and reminder.owner_id = actor_id
    and reminder.completed_at is null
    and reminder.cancelled_at is null
    and bike.owner_id = actor_id
    and bike.ownership_ended_on is null
    and bike.retired_on is null
  for update of reminder, bike;

  if not found then
    return false;
  end if;

  insert into public.bike_reminder_revisions (
    reminder_id, bike_id, owner_id, revision_type,
    change_reason, before_data
  )
  values (
    target_reminder.id, target_reminder.bike_id, actor_id, 'snoozed',
    'Udsat ' || days_to_snooze || ' dage',
    to_jsonb(target_reminder)
  );

  update public.bike_maintenance_reminders
  set
    due_on = (
      greatest(coalesce(due_on, current_date), current_date)
      + days_to_snooze
    ),
    updated_at = now()
  where id = target_reminder_id;
  return true;
end;
$$;

create or replace function public.prevent_retired_bike_transfer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.garage_bikes bike
    where bike.id = new.from_garage_bike_id
      and bike.retired_on is not null
  ) then
    raise exception 'En pensioneret cykel kan ikke overdrages';
  end if;
  return new;
end;
$$;

create trigger bike_transfer_invites_block_retired
before insert on public.bike_transfer_invites
for each row execute function public.prevent_retired_bike_transfer();

drop policy bike_maintenance_reminders_owner_insert
on public.bike_maintenance_reminders;

create policy bike_maintenance_reminders_owner_insert
on public.bike_maintenance_reminders for insert
with check (
  owner_id = public.current_app_user_id()
  and completed_at is null
  and completed_log_id is null
  and cancelled_at is null
  and exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
      and bike.ownership_ended_on is null
      and bike.retired_on is null
  )
);

create or replace function public.complete_bike_maintenance_reminder(
  target_reminder_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_bike_id uuid;
  reminder_title text;
  reminder_notes text;
  reminder_component public.component_category;
  current_odometer integer;
  new_log_id uuid;
begin
  if actor_id is null then
    raise exception 'Log ind for at afslutte vedligeholdelsen';
  end if;

  select
    reminder.bike_id,
    reminder.title,
    reminder.notes,
    reminder.component_category,
    bike.current_odometer_km
  into
    target_bike_id,
    reminder_title,
    reminder_notes,
    reminder_component,
    current_odometer
  from public.bike_maintenance_reminders reminder
  join public.garage_bikes bike on bike.id = reminder.bike_id
  where reminder.id = target_reminder_id
    and reminder.owner_id = actor_id
    and reminder.completed_at is null
    and reminder.cancelled_at is null
    and bike.owner_id = actor_id
    and bike.ownership_ended_on is null
    and bike.retired_on is null
  for update of reminder, bike;

  if not found then
    return null;
  end if;

  insert into public.bike_log_entries (
    bike_id,
    log_type,
    title,
    details,
    occurred_on,
    odometer_km,
    component_category,
    documentation_available
  )
  values (
    target_bike_id,
    'maintenance',
    left('Udført: ' || reminder_title, 120),
    reminder_notes,
    current_date,
    current_odometer,
    reminder_component,
    false
  )
  returning id into new_log_id;

  update public.bike_maintenance_reminders
  set
    completed_at = now(),
    completed_log_id = new_log_id,
    updated_at = now()
  where id = target_reminder_id;

  return new_log_id;
end;
$$;

revoke update, delete on public.bike_log_entries from cykelbasen_app;
revoke all on
  public.bike_lifecycle_events,
  public.bike_log_revisions,
  public.bike_reminder_revisions
from cykelbasen_app;
grant select on
  public.bike_lifecycle_events,
  public.bike_log_revisions,
  public.bike_reminder_revisions
to cykelbasen_app;
grant usage on type public.bike_retirement_reason to cykelbasen_app;

revoke all on function public.retire_garage_bike(
  uuid, date, public.bike_retirement_reason, text
) from public;
revoke all on function public.reactivate_garage_bike(uuid, text) from public;
revoke all on function public.correct_bike_log_entry(
  uuid, public.bike_log_type, text, text, date, integer, integer, integer,
  public.component_category, text, text, boolean, text
) from public;
revoke all on function public.void_bike_log_entry(uuid, text) from public;
revoke all on function public.update_bike_maintenance_reminder(
  uuid, text, public.component_category, date, integer, text, text, text
) from public;
revoke all on function public.cancel_bike_maintenance_reminder(uuid, text)
from public;
revoke all on function public.snooze_bike_maintenance_reminder(uuid, integer)
from public;

grant execute on function public.retire_garage_bike(
  uuid, date, public.bike_retirement_reason, text
) to cykelbasen_app;
grant execute on function public.reactivate_garage_bike(uuid, text)
to cykelbasen_app;
grant execute on function public.correct_bike_log_entry(
  uuid, public.bike_log_type, text, text, date, integer, integer, integer,
  public.component_category, text, text, boolean, text
) to cykelbasen_app;
grant execute on function public.void_bike_log_entry(uuid, text)
to cykelbasen_app;
grant execute on function public.update_bike_maintenance_reminder(
  uuid, text, public.component_category, date, integer, text, text, text
) to cykelbasen_app;
grant execute on function public.cancel_bike_maintenance_reminder(uuid, text)
to cykelbasen_app;
grant execute on function public.snooze_bike_maintenance_reminder(uuid, integer)
to cykelbasen_app;
