create type public.contact_request_status as enum (
  'new',
  'read',
  'closed'
);

create type public.contact_request_intent as enum (
  'question',
  'viewing',
  'offer',
  'other'
);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id text not null references public.profiles(id) on delete restrict,
  seller_id text not null references public.profiles(id) on delete restrict,
  intent public.contact_request_intent not null,
  buyer_email text not null check (char_length(buyer_email) between 3 and 320),
  message text not null check (char_length(message) between 20 and 2000),
  status public.contact_request_status not null default 'new',
  read_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint contact_request_parties_differ check (buyer_id <> seller_id),
  constraint contact_request_status_consistency check (
    (status = 'new' and read_at is null and closed_at is null)
    or
    (status = 'read' and read_at is not null and closed_at is null)
    or
    (status = 'closed' and read_at is not null and closed_at is not null)
  )
);

create unique index contact_requests_one_active_idx
  on public.contact_requests (buyer_id, listing_id)
  where status in ('new', 'read');
create index contact_requests_seller_status_created_idx
  on public.contact_requests (seller_id, status, created_at desc);
create index contact_requests_buyer_created_idx
  on public.contact_requests (buyer_id, created_at desc);

alter table public.contact_requests enable row level security;

create policy contact_requests_participant_read
on public.contact_requests for select
using (
  buyer_id = public.current_app_user_id()
  or seller_id = public.current_app_user_id()
);

create policy contact_requests_buyer_insert
on public.contact_requests for insert
with check (
  buyer_id = public.current_app_user_id()
  and buyer_id <> seller_id
  and status = 'new'
  and read_at is null
  and closed_at is null
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = seller_id
      and listing.status = 'published'
  )
);

create policy contact_requests_seller_update
on public.contact_requests for update
using (seller_id = public.current_app_user_id())
with check (seller_id = public.current_app_user_id());

create or replace function public.set_contact_request_timestamps()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status = 'closed' and new.status <> 'closed' then
    raise exception 'En afsluttet henvendelse kan ikke genåbnes';
  end if;

  if new.status = 'read' and old.status = 'new' then
    new.read_at = now();
  elsif new.status = 'closed' then
    new.read_at = coalesce(old.read_at, now());
    new.closed_at = now();
  end if;

  return new;
end;
$$;

create trigger contact_requests_set_status_timestamps
before update of status on public.contact_requests
for each row execute function public.set_contact_request_timestamps();

create table public.write_rate_limit_events (
  id bigint generated always as identity primary key,
  actor_id text not null,
  action_name text not null check (char_length(action_name) between 2 and 80),
  created_at timestamptz not null default clock_timestamp()
);

create index write_rate_limit_actor_action_created_idx
  on public.write_rate_limit_events (actor_id, action_name, created_at desc);

alter table public.write_rate_limit_events enable row level security;

create or replace function public.enforce_write_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id text := public.current_app_user_id();
  v_action_name text := tg_argv[0];
  maximum_events integer := tg_argv[1]::integer;
  window_seconds integer := tg_argv[2]::integer;
  used_events integer;
begin
  if v_actor_id is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_actor_id || ':' || v_action_name, 0)
  );

  delete from public.write_rate_limit_events
  where actor_id = v_actor_id
    and action_name = v_action_name
    and created_at < clock_timestamp() - interval '24 hours';

  select count(*)::integer
  into used_events
  from public.write_rate_limit_events
  where actor_id = v_actor_id
    and action_name = v_action_name
    and created_at >=
      clock_timestamp() - make_interval(secs => window_seconds);

  if used_events >= maximum_events then
    raise exception 'RATE_LIMIT:%', v_action_name;
  end if;

  insert into public.write_rate_limit_events (actor_id, action_name)
  values (v_actor_id, v_action_name);

  return new;
end;
$$;

create trigger contact_requests_rate_limit
before insert on public.contact_requests
for each row execute function public.enforce_write_rate_limit(
  'contact-request',
  '5',
  '3600'
);

create trigger forum_posts_rate_limit
before insert on public.forum_posts
for each row execute function public.enforce_write_rate_limit(
  'forum-post',
  '5',
  '3600'
);

create trigger forum_comments_rate_limit
before insert on public.forum_comments
for each row execute function public.enforce_write_rate_limit(
  'forum-comment',
  '20',
  '3600'
);

create trigger content_reports_rate_limit
before insert on public.content_reports
for each row execute function public.enforce_write_rate_limit(
  'forum-report',
  '10',
  '3600'
);

create trigger listing_reports_rate_limit
before insert on public.listing_reports
for each row execute function public.enforce_write_rate_limit(
  'listing-report',
  '10',
  '3600'
);

grant select, insert on public.contact_requests to cykelbasen_app;
revoke update, delete on public.contact_requests from cykelbasen_app;
grant update (status) on public.contact_requests to cykelbasen_app;
grant usage on type
  public.contact_request_status,
  public.contact_request_intent
to cykelbasen_app;

revoke all on public.write_rate_limit_events from cykelbasen_app;
