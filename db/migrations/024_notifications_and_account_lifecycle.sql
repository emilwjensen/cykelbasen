alter table public.profiles
  add column deleted_at timestamptz;

create type public.notification_type as enum (
  'contact-request',
  'ownership-review',
  'listing-reserved',
  'maintenance-due',
  'system'
);

create table public.notification_preferences (
  user_id text primary key references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  contact_email_enabled boolean not null default true,
  maintenance_email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  notification_type public.notification_type not null,
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 3 and 500),
  href text check (href is null or char_length(href) <= 500),
  deduplication_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index notifications_user_deduplication_idx
  on public.notifications (user_id, deduplication_key)
  where deduplication_key is not null;
create index notifications_user_unread_created_idx
  on public.notifications (user_id, read_at, created_at desc);

create table public.account_deletion_requests (
  user_id text primary key references public.profiles(id) on delete cascade,
  status text not null check (
    status in ('requested', 'processing', 'completed', 'failed')
  ),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  failure_note text,
  constraint account_deletion_completion_consistency check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy notification_preferences_owner_access
on public.notification_preferences for all
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

create policy notifications_owner_read
on public.notifications for select
using (user_id = public.current_app_user_id());

create policy notifications_owner_update
on public.notifications for update
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

create policy account_deletion_requests_owner_insert
on public.account_deletion_requests for insert
with check (
  user_id = public.current_app_user_id()
  and status = 'requested'
);

create policy account_deletion_requests_owner_read
on public.account_deletion_requests for select
using (user_id = public.current_app_user_id());

create policy account_deletion_requests_owner_delete_requested
on public.account_deletion_requests for delete
using (
  user_id = public.current_app_user_id()
  and status = 'requested'
);

create or replace function public.notify_contact_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (
    user_id,
    notification_type,
    title,
    body,
    href,
    deduplication_key
  )
  values (
    new.seller_id,
    'contact-request',
    'Ny køberhenvendelse',
    'En køber har sendt en struktureret henvendelse til din annonce.',
    '/henvendelser',
    'contact:' || new.id
  )
  on conflict do nothing;
  return new;
end;
$$;

create trigger contact_requests_create_notification
after insert on public.contact_requests
for each row execute function public.notify_contact_request();

create or replace function public.notify_ownership_review()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = new.status or new.status not in ('approved', 'rejected') then
    return new;
  end if;

  insert into public.notifications (
    user_id,
    notification_type,
    title,
    body,
    href,
    deduplication_key
  )
  values (
    new.owner_id,
    'ownership-review',
    case when new.status = 'approved'
      then 'Dokumentation godkendt'
      else 'Dokumentation kræver ændringer'
    end,
    case when new.status = 'approved'
      then 'Din annonce er godkendt og kan være publiceret.'
      else 'Læs moderatorens note og upload ny dokumentation.'
    end,
    '/mine-annoncer',
    'ownership-review:' || new.id || ':' || new.status
  )
  on conflict do nothing;
  return new;
end;
$$;

create trigger ownership_documents_create_notification
after update of status on public.ownership_documents
for each row execute function public.notify_ownership_review();

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  changed integer;
begin
  update public.notifications
  set read_at = now()
  where user_id = actor_id
    and read_at is null;
  get diagnostics changed = row_count;
  return changed;
end;
$$;

create or replace function public.delete_application_account()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  private_paths jsonb;
  public_paths jsonb;
begin
  if actor_id is null then
    raise exception 'Log ind for at slette kontoen';
  end if;

  select coalesce(jsonb_agg(path), '[]'::jsonb)
  into private_paths
  from (
    select object_key as path
    from public.bike_documents
    where owner_id = actor_id
    union all
    select object_key
    from public.ownership_documents
    where owner_id = actor_id
  ) paths;

  select coalesce(jsonb_agg(image.object_key), '[]'::jsonb)
  into public_paths
  from public.listing_images image
  join public.listings listing on listing.id = image.listing_id
  where listing.seller_id = actor_id;

  update public.account_deletion_requests
  set status = 'processing'
  where user_id = actor_id;

  delete from public.bike_documents where owner_id = actor_id;
  delete from public.ownership_documents where owner_id = actor_id;
  delete from public.bike_reminder_revisions where owner_id = actor_id;
  delete from public.bike_log_revisions where owner_id = actor_id;
  delete from public.bike_lifecycle_events where owner_id = actor_id;
  delete from public.bike_maintenance_reminders where owner_id = actor_id;
  delete from public.bike_log_entries log
  using public.garage_bikes bike
  where log.bike_id = bike.id and bike.owner_id = actor_id;

  update public.garage_bikes
  set
    serial_number_hash = null,
    notes = null,
    purchase_price_dkk = null,
    purchase_location = null
  where owner_id = actor_id;

  delete from public.listing_favorites where user_id = actor_id;
  delete from public.post_votes where user_id = actor_id;
  delete from public.comment_votes where user_id = actor_id;
  delete from public.contact_requests
  where buyer_id = actor_id or seller_id = actor_id;
  delete from public.content_reports where reporter_id = actor_id;
  delete from public.listing_reports where reporter_id = actor_id;
  delete from public.notifications where user_id = actor_id;
  delete from public.notification_preferences where user_id = actor_id;

  update public.bike_transfer_invites
  set status = 'cancelled'
  where from_owner_id = actor_id and status = 'pending';

  delete from public.listing_images image
  using public.listings listing
  where image.listing_id = listing.id
    and listing.seller_id = actor_id;

  delete from public.listings
  where seller_id = actor_id
    and status in ('draft', 'pending_review', 'rejected');

  perform set_config('app.user_id', '', true);

  update public.listings
  set
    status = 'archived',
    title = 'Arkiveret annonce',
    description = 'Annonceteksten er fjernet efter kontosletning.',
    city = 'Skjult'
  where seller_id = actor_id;

  update public.forum_posts
  set
    title = 'Indlæg fra slettet bruger',
    body = 'Indholdet er fjernet efter brugerens anmodning.'
  where author_id = actor_id;

  update public.forum_comments
  set body = 'Indholdet er fjernet efter brugerens anmodning.'
  where author_id = actor_id;

  update public.profiles
  set
    display_name = 'Slettet bruger',
    city = null,
    avatar_url = null,
    deleted_at = now()
  where id = actor_id;

  update public.account_deletion_requests
  set status = 'completed', completed_at = now()
  where user_id = actor_id;

  return jsonb_build_object(
    'private', private_paths,
    'public', public_paths
  );
end;
$$;

revoke all on
  public.notification_preferences,
  public.notifications,
  public.account_deletion_requests
from cykelbasen_app;
grant select, insert, update on public.notification_preferences
  to cykelbasen_app;
grant select, update on public.notifications to cykelbasen_app;
grant select, insert, delete on public.account_deletion_requests
  to cykelbasen_app;
grant usage on type public.notification_type to cykelbasen_app;

revoke all on function public.mark_all_notifications_read() from public;
revoke all on function public.delete_application_account() from public;
grant execute on function public.mark_all_notifications_read()
  to cykelbasen_app;
grant execute on function public.delete_application_account()
  to cykelbasen_app;
