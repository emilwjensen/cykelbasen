alter table public.listing_images
  add column original_filename text,
  add column content_type text,
  add column size_bytes bigint check (size_bytes is null or size_bytes between 1 and 5242880);

alter table public.ownership_documents
  add column original_filename text,
  add column content_type text,
  add column size_bytes bigint check (size_bytes is null or size_bytes between 1 and 10485760);

alter table public.listing_images
  drop constraint listing_images_listing_id_position_key;

alter table public.listing_images
  add constraint listing_images_listing_id_position_key
  unique (listing_id, position)
  deferrable initially immediate;

create unique index ownership_documents_one_pending_per_listing_idx
  on public.ownership_documents (listing_id)
  where status = 'pending';

drop policy listing_images_owner_write on public.listing_images;

create policy listing_images_owner_insert
on public.listing_images for insert
with check (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
      and listing.status in ('draft', 'rejected')
  )
);

create policy listing_images_owner_update
on public.listing_images for update
using (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
      and listing.status in ('draft', 'rejected')
  )
)
with check (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
      and listing.status in ('draft', 'rejected')
  )
);

create policy listing_images_owner_delete
on public.listing_images for delete
using (
  exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
      and listing.status in ('draft', 'rejected')
  )
);

drop policy ownership_documents_owner_insert on public.ownership_documents;

create policy ownership_documents_owner_insert
on public.ownership_documents for insert
with check (
  owner_id = public.current_app_user_id()
  and status = 'pending'
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
      and listing.status in ('draft', 'rejected')
  )
);

create policy ownership_documents_owner_delete
on public.ownership_documents for delete
using (
  owner_id = public.current_app_user_id()
  and status in ('pending', 'rejected')
  and exists (
    select 1
    from public.listings listing
    where listing.id = listing_id
      and listing.seller_id = public.current_app_user_id()
      and listing.status in ('draft', 'rejected')
  )
);

grant delete on public.ownership_documents to cykelbasen_app;

create or replace function public.enforce_listing_image_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended(new.listing_id::text || ':listing-images', 0)
  );

  if (
    select count(*)
    from public.listing_images image
    where image.listing_id = new.listing_id
  ) >= 8 then
    raise exception 'En annonce kan højst have 8 billeder';
  end if;

  return new;
end;
$$;

create trigger listing_images_count_limit
before insert on public.listing_images
for each row execute function public.enforce_listing_image_limit();

create trigger listing_images_rate_limit
before insert on public.listing_images
for each row execute function public.enforce_write_rate_limit(
  'listing-image',
  '20',
  '3600'
);

create trigger ownership_documents_rate_limit
before insert on public.ownership_documents
for each row execute function public.enforce_write_rate_limit(
  'ownership-document',
  '5',
  '86400'
);

create or replace function public.move_listing_image(
  target_image_id uuid,
  direction text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_listing_id uuid;
  target_position smallint;
  adjacent_image_id uuid;
  adjacent_position smallint;
begin
  if direction not in ('up', 'down') then
    raise exception 'Ugyldig billedretning';
  end if;

  select image.listing_id, image.position
  into target_listing_id, target_position
  from public.listing_images image
  join public.listings listing on listing.id = image.listing_id
  where image.id = target_image_id
    and listing.seller_id = actor_id
    and listing.status in ('draft', 'rejected')
  for update of image, listing;

  if not found then
    return false;
  end if;

  if direction = 'up' then
    select image.id, image.position
    into adjacent_image_id, adjacent_position
    from public.listing_images image
    where image.listing_id = target_listing_id
      and image.position < target_position
    order by image.position desc
    limit 1
    for update;
  else
    select image.id, image.position
    into adjacent_image_id, adjacent_position
    from public.listing_images image
    where image.listing_id = target_listing_id
      and image.position > target_position
    order by image.position
    limit 1
    for update;
  end if;

  if adjacent_image_id is null then
    return false;
  end if;

  set constraints listing_images_listing_id_position_key deferred;

  update public.listing_images
  set position = case
    when id = target_image_id then adjacent_position
    else target_position
  end
  where id in (target_image_id, adjacent_image_id);

  return true;
end;
$$;

create or replace function public.delete_listing_image(
  target_image_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  target_listing_id uuid;
  deleted_object_key text;
begin
  select image.listing_id
  into target_listing_id
  from public.listing_images image
  join public.listings listing on listing.id = image.listing_id
  where image.id = target_image_id
    and listing.seller_id = actor_id
    and listing.status in ('draft', 'rejected')
  for update of image, listing;

  if not found then
    return null;
  end if;

  delete from public.listing_images
  where id = target_image_id
  returning object_key into deleted_object_key;

  set constraints listing_images_listing_id_position_key deferred;

  with ordered as (
    select
      id,
      row_number() over (order by position, created_at, id) - 1 as new_position
    from public.listing_images
    where listing_id = target_listing_id
  )
  update public.listing_images image
  set position = ordered.new_position
  from ordered
  where image.id = ordered.id;

  return deleted_object_key;
end;
$$;

create or replace function public.delete_ownership_document(
  target_document_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  deleted_object_key text;
begin
  delete from public.ownership_documents document
  using public.listings listing
  where document.id = target_document_id
    and listing.id = document.listing_id
    and document.owner_id = actor_id
    and listing.seller_id = actor_id
    and document.status in ('pending', 'rejected')
    and listing.status in ('draft', 'rejected')
  returning document.object_key into deleted_object_key;

  return deleted_object_key;
end;
$$;

revoke all on function public.enforce_listing_image_limit() from public;
revoke all on function public.move_listing_image(uuid, text) from public;
revoke all on function public.delete_listing_image(uuid) from public;
revoke all on function public.delete_ownership_document(uuid) from public;

grant execute on function public.move_listing_image(uuid, text)
  to cykelbasen_app;
grant execute on function public.delete_listing_image(uuid)
  to cykelbasen_app;
grant execute on function public.delete_ownership_document(uuid)
  to cykelbasen_app;
