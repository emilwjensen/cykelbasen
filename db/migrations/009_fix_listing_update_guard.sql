create or replace function public.protect_seller_listing_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  actor_id text := public.current_app_user_id();
  content_changed boolean;
begin
  if actor_id is null
     or actor_id <> old.seller_id
     or public.is_moderator(actor_id)
  then
    return new;
  end if;

  content_changed :=
    (to_jsonb(new) - array['status', 'updated_at', 'search_vector'])
    is distinct from
    (to_jsonb(old) - array['status', 'updated_at', 'search_vector']);

  if old.status in ('draft', 'rejected') then
    if new.status not in ('draft', 'pending_review') then
      raise exception 'Kladder kan kun sendes til kontrol';
    end if;
    return new;
  end if;

  if content_changed then
    raise exception 'En aktiv eller afsluttet annonce kan ikke redigeres';
  end if;

  if old.status = 'pending_review'
     and new.status not in ('pending_review', 'draft')
  then
    raise exception 'En annonce under kontrol kan kun trækkes tilbage';
  elsif old.status = 'published'
     and new.status not in ('published', 'reserved', 'sold', 'archived')
  then
    raise exception 'Ugyldig statusændring for en publiceret annonce';
  elsif old.status = 'reserved'
     and new.status not in ('reserved', 'published', 'sold', 'archived')
  then
    raise exception 'Ugyldig statusændring for en reserveret annonce';
  elsif old.status = 'sold'
     and new.status not in ('sold', 'archived')
  then
    raise exception 'En solgt annonce kan kun arkiveres';
  elsif old.status = 'archived' and new.status <> 'archived' then
    raise exception 'En arkiveret annonce kan ikke genåbnes';
  end if;

  return new;
end;
$$;
