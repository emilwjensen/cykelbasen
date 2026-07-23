create type public.listing_report_reason as enum (
  'suspected-scam',
  'suspected-stolen',
  'misleading',
  'prohibited',
  'duplicate',
  'other'
);

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id text not null references public.profiles(id) on delete restrict,
  listing_id uuid not null references public.listings(id) on delete cascade,
  reason public.listing_report_reason not null,
  details text check (
    details is null or char_length(details) between 5 and 1000
  ),
  status public.content_report_status not null default 'open',
  moderated_by text references public.profiles(id) on delete set null,
  moderation_note text check (
    moderation_note is null or char_length(moderation_note) between 5 and 1000
  ),
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, listing_id),
  constraint listing_report_moderation_consistency check (
    (
      status = 'open'
      and moderated_by is null
      and moderated_at is null
      and moderation_note is null
    )
    or
    (
      status in ('resolved', 'dismissed')
      and moderated_by is not null
      and moderated_at is not null
      and moderation_note is not null
    )
  )
);

create index listing_reports_status_created_idx
  on public.listing_reports (status, created_at);
create index listing_reports_listing_status_idx
  on public.listing_reports (listing_id, status);

alter table public.listing_reports enable row level security;

create policy listing_reports_reporter_or_moderator_read
on public.listing_reports for select
using (
  reporter_id = public.current_app_user_id()
  or public.is_moderator()
);

create policy listing_reports_reporter_insert
on public.listing_reports for insert
with check (
  reporter_id = public.current_app_user_id()
  and status = 'open'
  and moderated_by is null
  and moderated_at is null
  and moderation_note is null
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.status = 'published'
      and listing.seller_id <> public.current_app_user_id()
  )
);

create or replace function public.moderate_listing_report(
  report_id uuid,
  decision text,
  note text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_listing_id uuid;
  previous_status public.listing_status;
  moderator_id text := public.current_app_user_id();
begin
  if not public.is_moderator(moderator_id) then
    raise exception 'Moderatoradgang kræves';
  end if;

  if decision not in ('hide', 'dismiss') then
    raise exception 'Ugyldig moderatorbeslutning';
  end if;

  if note is null or char_length(btrim(note)) < 5 or char_length(note) > 1000 then
    raise exception 'Moderatornote skal være mellem 5 og 1000 tegn';
  end if;

  select listing_id
  into target_listing_id
  from public.listing_reports
  where id = report_id and status = 'open'
  for update;

  if not found then
    return false;
  end if;

  if decision = 'hide' then
    select status
    into previous_status
    from public.listings
    where id = target_listing_id
    for update;

    if previous_status in ('published', 'reserved', 'sold') then
      update public.listings
      set status = 'archived'
      where id = target_listing_id;

      insert into public.listing_status_events (
        listing_id,
        actor_id,
        from_status,
        to_status
      )
      values (
        target_listing_id,
        moderator_id,
        previous_status,
        'archived'
      );
    end if;
  end if;

  update public.listing_reports
  set
    status = case
      when decision = 'hide' then 'resolved'::public.content_report_status
      else 'dismissed'::public.content_report_status
    end,
    moderated_by = moderator_id,
    moderation_note = btrim(note),
    moderated_at = now()
  where id = report_id;

  return true;
end;
$$;

revoke all on function public.moderate_listing_report(uuid, text, text)
  from public;
grant execute on function public.moderate_listing_report(uuid, text, text)
  to cykelbasen_app;

grant select, insert on public.listing_reports to cykelbasen_app;
revoke update, delete on public.listing_reports from cykelbasen_app;
grant usage on type public.listing_report_reason to cykelbasen_app;
