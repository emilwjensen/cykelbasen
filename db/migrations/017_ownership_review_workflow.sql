create or replace function public.submit_listing_for_review(
  target_listing_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  previous_status public.listing_status;
begin
  if actor_id is null then
    raise exception 'Log ind for at sende annoncen til kontrol';
  end if;

  select status
  into previous_status
  from public.listings
  where id = target_listing_id
    and seller_id = actor_id
    and status in ('draft', 'rejected')
  for update;

  if not found then
    return false;
  end if;

  if not exists (
    select 1
    from public.listing_images image
    where image.listing_id = target_listing_id
  ) then
    raise exception 'Mindst ét billede kræves før kontrol';
  end if;

  if not exists (
    select 1
    from public.ownership_documents document
    where document.listing_id = target_listing_id
      and document.owner_id = actor_id
      and document.status = 'pending'
  ) then
    raise exception 'Afventende ejerskabsdokumentation kræves før kontrol';
  end if;

  update public.listings
  set status = 'pending_review'
  where id = target_listing_id;

  insert into public.listing_status_events (
    listing_id,
    actor_id,
    from_status,
    to_status
  )
  values (
    target_listing_id,
    actor_id,
    previous_status,
    'pending_review'
  );

  return true;
end;
$$;

create or replace function public.moderate_ownership_document(
  target_document_id uuid,
  decision text,
  note text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  moderator_id text := public.current_app_user_id();
  target_listing_id uuid;
begin
  if not public.is_moderator(moderator_id) then
    raise exception 'Moderatoradgang kræves';
  end if;

  if decision not in ('approve', 'reject') then
    raise exception 'Ugyldig moderatorbeslutning';
  end if;

  if note is null or char_length(btrim(note)) < 5 or char_length(note) > 1000 then
    raise exception 'Moderatornote skal være mellem 5 og 1000 tegn';
  end if;

  select document.listing_id
  into target_listing_id
  from public.ownership_documents document
  join public.listings listing on listing.id = document.listing_id
  where document.id = target_document_id
    and document.status = 'pending'
    and listing.status = 'pending_review'
    and listing.seller_id = document.owner_id
  for update of document, listing;

  if not found then
    return false;
  end if;

  update public.ownership_documents
  set
    status = case
      when decision = 'approve' then 'approved'::public.document_status
      else 'rejected'::public.document_status
    end,
    review_note = btrim(note),
    reviewed_by = moderator_id,
    reviewed_at = now()
  where id = target_document_id;

  if decision = 'approve' then
    update public.listings
    set status = 'published', published_at = now()
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
      'pending_review',
      'published'
    );
  else
    update public.listings
    set status = 'rejected'
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
      'pending_review',
      'rejected'
    );
  end if;

  return true;
end;
$$;

revoke all on function public.submit_listing_for_review(uuid) from public;
revoke all on function public.moderate_ownership_document(uuid, text, text)
  from public;
grant execute on function public.submit_listing_for_review(uuid)
  to cykelbasen_app;
grant execute on function public.moderate_ownership_document(uuid, text, text)
  to cykelbasen_app;

revoke update on public.ownership_documents from cykelbasen_app;
