create table public.forum_categories (
  slug text primary key,
  name text not null unique check (char_length(name) between 2 and 80),
  description text not null check (char_length(description) between 10 and 240),
  position smallint not null unique check (position >= 0),
  created_at timestamptz not null default now()
);

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null references public.forum_categories(slug) on delete restrict,
  author_id text not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 8 and 140),
  body text not null check (char_length(body) between 20 and 10000),
  score integer not null default 0,
  hidden_at timestamptz,
  hidden_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_post_hidden_consistency check (
    (hidden_at is null and hidden_by is null)
    or
    (hidden_at is not null and hidden_by is not null)
  )
);

create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id text not null references public.profiles(id) on delete restrict,
  parent_id uuid references public.forum_comments(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 5000),
  score integer not null default 0,
  hidden_at timestamptz,
  hidden_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_comment_not_own_parent check (parent_id is null or parent_id <> id),
  constraint forum_comment_hidden_consistency check (
    (hidden_at is null and hidden_by is null)
    or
    (hidden_at is not null and hidden_by is not null)
  )
);

create table public.post_votes (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comment_votes (
  comment_id uuid not null references public.forum_comments(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index forum_posts_category_created_idx
  on public.forum_posts (category_slug, created_at desc)
  where hidden_at is null;
create index forum_posts_score_created_idx
  on public.forum_posts (score desc, created_at desc)
  where hidden_at is null;
create index forum_comments_post_created_idx
  on public.forum_comments (post_id, created_at)
  where hidden_at is null;
create index forum_comments_parent_created_idx
  on public.forum_comments (parent_id, created_at)
  where hidden_at is null;

create trigger forum_posts_set_updated_at
before update of title, body, category_slug on public.forum_posts
for each row execute function public.set_updated_at();

create trigger forum_comments_set_updated_at
before update of body on public.forum_comments
for each row execute function public.set_updated_at();

create trigger post_votes_set_updated_at
before update of value on public.post_votes
for each row execute function public.set_updated_at();

create trigger comment_votes_set_updated_at
before update of value on public.comment_votes
for each row execute function public.set_updated_at();

create or replace function public.enforce_one_level_forum_reply()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_post_id uuid;
  parent_parent_id uuid;
  parent_hidden_at timestamptz;
begin
  if new.parent_id is null then
    return new;
  end if;

  select post_id, parent_id, hidden_at
  into parent_post_id, parent_parent_id, parent_hidden_at
  from public.forum_comments
  where id = new.parent_id;

  if parent_post_id is null
     or parent_post_id <> new.post_id
     or parent_parent_id is not null
     or parent_hidden_at is not null
  then
    raise exception 'Et forumsvar skal pege på en synlig topniveau-kommentar i samme indlæg';
  end if;

  return new;
end;
$$;

create trigger forum_comments_enforce_one_level_reply
before insert or update of parent_id, post_id on public.forum_comments
for each row execute function public.enforce_one_level_forum_reply();

create or replace function public.apply_post_vote_score()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_posts set score = score + new.value where id = new.post_id;
  elsif tg_op = 'UPDATE' then
    update public.forum_posts set score = score + new.value - old.value where id = new.post_id;
  else
    update public.forum_posts set score = score - old.value where id = old.post_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger post_votes_apply_score
after insert or update of value or delete on public.post_votes
for each row execute function public.apply_post_vote_score();

create or replace function public.apply_comment_vote_score()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_comments set score = score + new.value where id = new.comment_id;
  elsif tg_op = 'UPDATE' then
    update public.forum_comments set score = score + new.value - old.value where id = new.comment_id;
  else
    update public.forum_comments set score = score - old.value where id = old.comment_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger comment_votes_apply_score
after insert or update of value or delete on public.comment_votes
for each row execute function public.apply_comment_vote_score();

alter table public.forum_categories enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.comment_votes enable row level security;

create policy forum_categories_public_read
on public.forum_categories for select
using (true);

create policy forum_posts_public_read
on public.forum_posts for select
using (
  hidden_at is null
  or author_id = public.current_app_user_id()
  or public.is_moderator()
);

create policy forum_posts_author_insert
on public.forum_posts for insert
with check (
  author_id = public.current_app_user_id()
  and score = 0
  and hidden_at is null
  and hidden_by is null
);

create policy forum_posts_author_update
on public.forum_posts for update
using (author_id = public.current_app_user_id())
with check (author_id = public.current_app_user_id());

create policy forum_comments_public_read
on public.forum_comments for select
using (
  (
    hidden_at is null
    and exists (
      select 1
      from public.forum_posts post
      where post.id = post_id and post.hidden_at is null
    )
  )
  or author_id = public.current_app_user_id()
  or public.is_moderator()
);

create policy forum_comments_author_insert
on public.forum_comments for insert
with check (
  author_id = public.current_app_user_id()
  and score = 0
  and hidden_at is null
  and hidden_by is null
  and exists (
    select 1
    from public.forum_posts post
    where post.id = post_id and post.hidden_at is null
  )
);

create policy forum_comments_author_update
on public.forum_comments for update
using (author_id = public.current_app_user_id())
with check (author_id = public.current_app_user_id());

create policy post_votes_owner_read
on public.post_votes for select
using (user_id = public.current_app_user_id() or public.is_moderator());

create policy post_votes_owner_insert
on public.post_votes for insert
with check (
  user_id = public.current_app_user_id()
  and exists (
    select 1
    from public.forum_posts post
    where post.id = post_id and post.hidden_at is null
  )
);

create policy post_votes_owner_update
on public.post_votes for update
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

create policy post_votes_owner_delete
on public.post_votes for delete
using (user_id = public.current_app_user_id());

create policy comment_votes_owner_read
on public.comment_votes for select
using (user_id = public.current_app_user_id() or public.is_moderator());

create policy comment_votes_owner_insert
on public.comment_votes for insert
with check (
  user_id = public.current_app_user_id()
  and exists (
    select 1
    from public.forum_comments comment
    join public.forum_posts post on post.id = comment.post_id
    where comment.id = comment_id
      and comment.hidden_at is null
      and post.hidden_at is null
  )
);

create policy comment_votes_owner_update
on public.comment_votes for update
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

create policy comment_votes_owner_delete
on public.comment_votes for delete
using (user_id = public.current_app_user_id());

grant select on public.forum_categories to cykelbasen_app;
grant select, insert on public.forum_posts to cykelbasen_app;
grant update (category_slug, title, body) on public.forum_posts to cykelbasen_app;
grant select, insert on public.forum_comments to cykelbasen_app;
grant update (body) on public.forum_comments to cykelbasen_app;
grant select, insert, update, delete on public.post_votes to cykelbasen_app;
grant select, insert, update, delete on public.comment_votes to cykelbasen_app;

insert into public.forum_categories (slug, name, description, position)
values
  ('koebshjaelp', 'Købshjælp', 'Få hjælp til at vurdere en konkret cykel eller annonce.', 0),
  ('cykelvalg-og-stoerrelse', 'Cykelvalg og størrelse', 'Tal om geometri, pasform og valg af den rigtige racercykel.', 1),
  ('udstyr-og-komponenter', 'Udstyr og komponenter', 'Erfaringer med geargrupper, hjul, dæk og andet udstyr.', 2),
  ('vedligeholdelse', 'Vedligeholdelse', 'Spørgsmål og råd om service, reparationer og opsætning.', 3),
  ('prisvurdering', 'Prisvurdering', 'Få perspektiv på priser for cykler og komponenter.', 4),
  ('traening-og-ture', 'Træning og ture', 'Del træningserfaringer, ruter og idéer til fælles ture.', 5),
  ('svindel-og-stjaalne-cykler', 'Svindel og stjålne cykler', 'Advarsler, forebyggelse og hjælp ved mistænkelige handler.', 6),
  ('feedback-til-platformen', 'Feedback til platformen', 'Forslag og feedback til udviklingen af Cykelbasen.', 7);
