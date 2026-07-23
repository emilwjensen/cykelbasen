create type public.content_report_reason as enum (
  'spam',
  'scam',
  'harassment',
  'personal-data',
  'other'
);

create type public.content_report_status as enum (
  'open',
  'resolved',
  'dismissed'
);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id text not null references public.profiles(id) on delete restrict,
  post_id uuid references public.forum_posts(id) on delete cascade,
  comment_id uuid references public.forum_comments(id) on delete cascade,
  reason public.content_report_reason not null,
  details text check (details is null or char_length(details) between 5 and 1000),
  status public.content_report_status not null default 'open',
  moderated_by text references public.profiles(id) on delete set null,
  moderation_note text check (
    moderation_note is null or char_length(moderation_note) between 5 and 1000
  ),
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint content_report_one_target check (
    (post_id is not null and comment_id is null)
    or
    (post_id is null and comment_id is not null)
  ),
  constraint content_report_moderation_consistency check (
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

create unique index content_reports_reporter_post_unique
  on public.content_reports (reporter_id, post_id)
  where post_id is not null;
create unique index content_reports_reporter_comment_unique
  on public.content_reports (reporter_id, comment_id)
  where comment_id is not null;
create index content_reports_status_created_idx
  on public.content_reports (status, created_at);

alter table public.content_reports enable row level security;

create policy content_reports_reporter_or_moderator_read
on public.content_reports for select
using (
  reporter_id = public.current_app_user_id()
  or public.is_moderator()
);

create policy content_reports_reporter_insert
on public.content_reports for insert
with check (
  reporter_id = public.current_app_user_id()
  and status = 'open'
  and moderated_by is null
  and moderated_at is null
  and moderation_note is null
  and (
    (
      post_id is not null
      and comment_id is null
      and exists (
        select 1
        from public.forum_posts post
        where post.id = post_id
          and post.hidden_at is null
          and post.author_id <> public.current_app_user_id()
      )
    )
    or
    (
      post_id is null
      and comment_id is not null
      and exists (
        select 1
        from public.forum_comments comment
        join public.forum_posts post on post.id = comment.post_id
        where comment.id = comment_id
          and comment.hidden_at is null
          and post.hidden_at is null
          and comment.author_id <> public.current_app_user_id()
      )
    )
  )
);

create or replace function public.moderate_forum_report(
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
  target_post_id uuid;
  target_comment_id uuid;
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

  select post_id, comment_id
  into target_post_id, target_comment_id
  from public.content_reports
  where id = report_id and status = 'open'
  for update;

  if not found then
    return false;
  end if;

  if decision = 'hide' then
    if target_post_id is not null then
      update public.forum_posts
      set hidden_at = now(), hidden_by = moderator_id
      where id = target_post_id and hidden_at is null;
    else
      update public.forum_comments
      set hidden_at = now(), hidden_by = moderator_id
      where id = target_comment_id and hidden_at is null;
    end if;
  end if;

  update public.content_reports
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

revoke all on function public.moderate_forum_report(uuid, text, text) from public;
grant execute on function public.moderate_forum_report(uuid, text, text)
  to cykelbasen_app;

revoke update, delete on public.content_reports from cykelbasen_app;
grant select, insert on public.content_reports to cykelbasen_app;
grant usage on type
  public.content_report_reason,
  public.content_report_status
to cykelbasen_app;
