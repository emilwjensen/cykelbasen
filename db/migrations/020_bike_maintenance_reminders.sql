create table public.bike_maintenance_reminders (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.garage_bikes(id) on delete cascade,
  owner_id text not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  component_category public.component_category,
  due_on date,
  due_odometer_km integer check (
    due_odometer_km is null
    or due_odometer_km between 0 and 1000000
  ),
  notes text check (notes is null or char_length(notes) <= 2000),
  completed_at timestamptz,
  completed_log_id uuid
    references public.bike_log_entries(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint bike_maintenance_reminder_has_due_target
    check (due_on is not null or due_odometer_km is not null)
);

create index bike_maintenance_reminders_bike_open_due_idx
  on public.bike_maintenance_reminders (
    bike_id,
    completed_at,
    due_on,
    due_odometer_km
  );
create index bike_maintenance_reminders_owner_open_idx
  on public.bike_maintenance_reminders (owner_id, completed_at, created_at desc);

alter table public.bike_maintenance_reminders enable row level security;

create policy bike_maintenance_reminders_owner_read
on public.bike_maintenance_reminders for select
using (owner_id = public.current_app_user_id());

create policy bike_maintenance_reminders_owner_insert
on public.bike_maintenance_reminders for insert
with check (
  owner_id = public.current_app_user_id()
  and completed_at is null
  and completed_log_id is null
  and exists (
    select 1
    from public.garage_bikes bike
    where bike.id = bike_id
      and bike.owner_id = public.current_app_user_id()
      and bike.ownership_ended_on is null
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
    and bike.owner_id = actor_id
    and bike.ownership_ended_on is null
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
    completed_log_id = new_log_id
  where id = target_reminder_id;

  return new_log_id;
end;
$$;

revoke all on table public.bike_maintenance_reminders from cykelbasen_app;
grant select, insert on table public.bike_maintenance_reminders
  to cykelbasen_app;

revoke all on function public.complete_bike_maintenance_reminder(uuid)
  from public;
grant execute on function public.complete_bike_maintenance_reminder(uuid)
  to cykelbasen_app;
