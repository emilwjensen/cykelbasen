create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.bike_category as enum (
  'road',
  'gravel',
  'cyclocross',
  'triathlon_tt',
  'vintage',
  'e_road'
);

create type public.frame_material as enum (
  'aluminium',
  'carbon',
  'steel',
  'titanium',
  'other',
  'unknown'
);

create type public.brake_type as enum (
  'rim',
  'mechanical_disc',
  'hydraulic_disc',
  'other',
  'unknown'
);

create type public.bike_condition as enum (
  'like_new',
  'good',
  'used',
  'project'
);

create type public.listing_status as enum (
  'draft',
  'pending_review',
  'published',
  'reserved',
  'sold',
  'rejected',
  'archived'
);

create type public.document_type as enum (
  'receipt',
  'order_confirmation',
  'purchase_agreement',
  'insurance',
  'service_record',
  'other'
);

create type public.review_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.content_status as enum (
  'active',
  'hidden',
  'deleted'
);

create type public.report_target_type as enum (
  'listing',
  'forum_post',
  'forum_comment',
  'profile'
);

create type public.report_status as enum (
  'open',
  'reviewing',
  'resolved',
  'dismissed'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique,
  display_name text not null default '',
  avatar_path text,
  city text,
  bio text check (char_length(bio) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_moderator(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.moderators
    where user_id = check_user_id
  );
$$;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 20 and 5000),
  category public.bike_category not null,
  brand citext not null,
  model citext not null,
  model_year smallint check (model_year between 1900 and 2100),
  frame_size_label text not null check (char_length(frame_size_label) between 1 and 20),
  frame_size_cm smallint check (frame_size_cm between 35 and 75),
  frame_material public.frame_material not null default 'unknown',
  groupset_brand citext,
  groupset_model citext,
  drivetrain text check (char_length(drivetrain) <= 30),
  brake_type public.brake_type not null default 'unknown',
  wheel_size text check (char_length(wheel_size) <= 30),
  electronic_shifting boolean not null default false,
  condition public.bike_condition not null,
  price_dkk integer not null check (price_dkk > 0 and price_dkk <= 1000000),
  city text not null check (char_length(city) between 2 and 100),
  postal_code text check (postal_code ~ '^[0-9]{4}$'),
  shipping_offered boolean not null default false,
  status public.listing_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(brand::text, '') || ' ' ||
      coalesce(model::text, '') || ' ' ||
      coalesce(groupset_brand::text, '') || ' ' ||
      coalesce(groupset_model::text, '') || ' ' ||
      coalesce(description, '')
    )
  ) stored
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  alt_text text check (char_length(alt_text) <= 200),
  position smallint not null default 0 check (position >= 0),
  width integer check (width > 0),
  height integer check (height > 0),
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

create table public.ownership_documents (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  document_type public.document_type not null,
  storage_path text not null unique,
  frame_number_normalized text,
  frame_number_last4 text generated always as (right(frame_number_normalized, 4)) stored,
  review_status public.review_status not null default 'pending',
  review_note text check (char_length(review_note) <= 1000),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique,
  description text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 180),
  body text not null check (char_length(body) between 10 and 10000),
  status public.content_status not null default 'active',
  score integer not null default 0,
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  parent_comment_id uuid references public.forum_comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  status public.content_status not null default 'active',
  score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_comment_id <> id)
);

create table public.post_votes (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comment_votes (
  comment_id uuid not null references public.forum_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status public.report_status not null default 'open',
  moderator_note text check (char_length(moderator_note) <= 2000),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles(id),
  target_type public.report_target_type not null,
  target_id uuid not null,
  action text not null check (char_length(action) between 2 and 100),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create trigger forum_posts_set_updated_at
before update on public.forum_posts
for each row execute function public.set_updated_at();

create trigger forum_comments_set_updated_at
before update on public.forum_comments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.enforce_listing_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    if not exists (
      select 1
      from public.ownership_documents d
      where d.listing_id = new.id
        and d.review_status = 'approved'
    ) then
      raise exception 'Listing requires approved ownership documentation before publication';
    end if;
    new.published_at = coalesce(new.published_at, now());
  end if;

  if new.status <> 'published' and old.status = 'published' and new.status not in ('reserved', 'sold') then
    new.published_at = old.published_at;
  end if;

  return new;
end;
$$;

create trigger listings_enforce_publication
before update on public.listings
for each row execute function public.enforce_listing_publication();

create or replace function public.protect_forum_counters()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() = 1 and not public.is_moderator() then
    new.score = old.score;
    if tg_table_name = 'forum_posts' then
      new.comment_count = old.comment_count;
    end if;
  end if;
  return new;
end;
$$;

create trigger forum_posts_protect_counters
before update on public.forum_posts
for each row execute function public.protect_forum_counters();

create trigger forum_comments_protect_counters
before update on public.forum_comments
for each row execute function public.protect_forum_counters();

create or replace function public.apply_post_vote_delta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_posts set score = score + new.value where id = new.post_id;
    return new;
  elsif tg_op = 'UPDATE' then
    update public.forum_posts set score = score + new.value - old.value where id = new.post_id;
    return new;
  else
    update public.forum_posts set score = score - old.value where id = old.post_id;
    return old;
  end if;
end;
$$;

create trigger post_votes_apply_delta
after insert or update or delete on public.post_votes
for each row execute function public.apply_post_vote_delta();

create or replace function public.apply_comment_vote_delta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_comments set score = score + new.value where id = new.comment_id;
    return new;
  elsif tg_op = 'UPDATE' then
    update public.forum_comments set score = score + new.value - old.value where id = new.comment_id;
    return new;
  else
    update public.forum_comments set score = score - old.value where id = old.comment_id;
    return old;
  end if;
end;
$$;

create trigger comment_votes_apply_delta
after insert or update or delete on public.comment_votes
for each row execute function public.apply_comment_vote_delta();

create or replace function public.apply_comment_count_delta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.forum_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger forum_comments_apply_count
after insert or delete on public.forum_comments
for each row execute function public.apply_comment_count_delta();

create index listings_status_published_idx on public.listings (status, published_at desc);
create index listings_category_published_idx on public.listings (category, published_at desc);
create index listings_brand_model_idx on public.listings (brand, model);
create index listings_price_idx on public.listings (price_dkk);
create index listings_frame_size_label_idx on public.listings (frame_size_label);
create index listings_frame_size_cm_idx on public.listings (frame_size_cm);
create index listings_frame_material_idx on public.listings (frame_material);
create index listings_brake_type_idx on public.listings (brake_type);
create index listings_condition_idx on public.listings (condition);
create index listings_city_idx on public.listings (city);
create index listings_search_idx on public.listings using gin (search_vector);
create index listing_images_listing_position_idx on public.listing_images (listing_id, position);
create index ownership_documents_listing_status_idx on public.ownership_documents (listing_id, review_status);
create index forum_posts_category_created_idx on public.forum_posts (category_id, created_at desc);
create index forum_posts_score_idx on public.forum_posts (score desc, created_at desc);
create index forum_comments_post_created_idx on public.forum_comments (post_id, created_at);
create index content_reports_status_created_idx on public.content_reports (status, created_at);

alter table public.profiles enable row level security;
alter table public.moderators enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.ownership_documents enable row level security;
alter table public.favorites enable row level security;
alter table public.forum_categories enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.comment_votes enable row level security;
alter table public.content_reports enable row level security;
alter table public.moderation_events enable row level security;

create policy profiles_public_read
on public.profiles for select
using (true);

create policy profiles_owner_update
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy moderators_self_or_moderator_read
on public.moderators for select
to authenticated
using (user_id = auth.uid() or public.is_moderator());

create policy listings_public_or_owner_read
on public.listings for select
using (
  status in ('published', 'reserved', 'sold')
  or seller_id = auth.uid()
  or public.is_moderator()
);

create policy listings_owner_insert
on public.listings for insert
to authenticated
with check (seller_id = auth.uid());

create policy listings_owner_or_moderator_update
on public.listings for update
to authenticated
using (seller_id = auth.uid() or public.is_moderator())
with check (seller_id = auth.uid() or public.is_moderator());

create policy listings_owner_or_moderator_delete
on public.listings for delete
to authenticated
using (seller_id = auth.uid() or public.is_moderator());

create policy listing_images_public_or_owner_read
on public.listing_images for select
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and (l.status in ('published', 'reserved', 'sold') or l.seller_id = auth.uid() or public.is_moderator())
  )
);

create policy listing_images_owner_insert
on public.listing_images for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = auth.uid()
  )
);

create policy listing_images_owner_update
on public.listing_images for update
to authenticated
using (owner_id = auth.uid() or public.is_moderator())
with check (owner_id = auth.uid() or public.is_moderator());

create policy listing_images_owner_delete
on public.listing_images for delete
to authenticated
using (owner_id = auth.uid() or public.is_moderator());

create policy ownership_documents_owner_or_moderator_read
on public.ownership_documents for select
to authenticated
using (owner_id = auth.uid() or public.is_moderator());

create policy ownership_documents_owner_insert
on public.ownership_documents for insert
to authenticated
with check (
  owner_id = auth.uid()
  and review_status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = auth.uid()
  )
);

create policy ownership_documents_moderator_update
on public.ownership_documents for update
to authenticated
using (public.is_moderator())
with check (public.is_moderator());

create policy ownership_documents_owner_pending_delete
on public.ownership_documents for delete
to authenticated
using ((owner_id = auth.uid() and review_status <> 'approved') or public.is_moderator());

create policy favorites_owner_read
on public.favorites for select
to authenticated
using (user_id = auth.uid());

create policy favorites_owner_insert
on public.favorites for insert
to authenticated
with check (user_id = auth.uid());

create policy favorites_owner_delete
on public.favorites for delete
to authenticated
using (user_id = auth.uid());

create policy forum_categories_public_read
on public.forum_categories for select
using (true);

create policy forum_categories_moderator_write
on public.forum_categories for all
to authenticated
using (public.is_moderator())
with check (public.is_moderator());

create policy forum_posts_public_read
on public.forum_posts for select
using (status = 'active' or author_id = auth.uid() or public.is_moderator());

create policy forum_posts_owner_insert
on public.forum_posts for insert
to authenticated
with check (author_id = auth.uid() and status = 'active' and score = 0 and comment_count = 0);

create policy forum_posts_owner_or_moderator_update
on public.forum_posts for update
to authenticated
using (author_id = auth.uid() or public.is_moderator())
with check (author_id = auth.uid() or public.is_moderator());

create policy forum_posts_owner_or_moderator_delete
on public.forum_posts for delete
to authenticated
using (author_id = auth.uid() or public.is_moderator());

create policy forum_comments_public_read
on public.forum_comments for select
using (status = 'active' or author_id = auth.uid() or public.is_moderator());

create policy forum_comments_owner_insert
on public.forum_comments for insert
to authenticated
with check (
  author_id = auth.uid()
  and status = 'active'
  and score = 0
  and exists (select 1 from public.forum_posts p where p.id = post_id and p.status = 'active')
  and (
    parent_comment_id is null
    or exists (
      select 1 from public.forum_comments c
      where c.id = forum_comments.parent_comment_id
        and c.post_id = forum_comments.post_id
        and c.parent_comment_id is null
    )
  )
);

create policy forum_comments_owner_or_moderator_update
on public.forum_comments for update
to authenticated
using (author_id = auth.uid() or public.is_moderator())
with check (author_id = auth.uid() or public.is_moderator());

create policy forum_comments_owner_or_moderator_delete
on public.forum_comments for delete
to authenticated
using (author_id = auth.uid() or public.is_moderator());

create policy post_votes_owner_read
on public.post_votes for select
to authenticated
using (user_id = auth.uid() or public.is_moderator());

create policy post_votes_owner_insert
on public.post_votes for insert
to authenticated
with check (user_id = auth.uid());

create policy post_votes_owner_update
on public.post_votes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy post_votes_owner_delete
on public.post_votes for delete
to authenticated
using (user_id = auth.uid());

create policy comment_votes_owner_read
on public.comment_votes for select
to authenticated
using (user_id = auth.uid() or public.is_moderator());

create policy comment_votes_owner_insert
on public.comment_votes for insert
to authenticated
with check (user_id = auth.uid());

create policy comment_votes_owner_update
on public.comment_votes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy comment_votes_owner_delete
on public.comment_votes for delete
to authenticated
using (user_id = auth.uid());

create policy content_reports_reporter_or_moderator_read
on public.content_reports for select
to authenticated
using (reporter_id = auth.uid() or public.is_moderator());

create policy content_reports_reporter_insert
on public.content_reports for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and status = 'open'
  and reviewed_by is null
  and reviewed_at is null
);

create policy content_reports_moderator_update
on public.content_reports for update
to authenticated
using (public.is_moderator())
with check (public.is_moderator());

create policy moderation_events_moderator_read
on public.moderation_events for select
to authenticated
using (public.is_moderator());

create policy moderation_events_moderator_insert
on public.moderation_events for insert
to authenticated
with check (public.is_moderator() and moderator_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'listing-images',
    'listing-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'ownership-documents',
    'ownership-documents',
    false,
    15728640,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy listing_images_storage_public_read
on storage.objects for select
using (bucket_id = 'listing-images');

create policy listing_images_storage_owner_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy listing_images_storage_owner_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'listing-images'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator())
)
with check (
  bucket_id = 'listing-images'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator())
);

create policy listing_images_storage_owner_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator())
);

create policy ownership_documents_storage_private_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'ownership-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator())
);

create policy ownership_documents_storage_owner_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'ownership-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy ownership_documents_storage_owner_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'ownership-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator())
);

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.listings, public.listing_images, public.forum_categories, public.forum_posts, public.forum_comments to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_moderator(uuid) to anon, authenticated;
