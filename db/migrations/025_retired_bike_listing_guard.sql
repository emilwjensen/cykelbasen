create or replace function public.validate_listing_garage_bike()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.garage_bike_id is not null
     and not exists (
       select 1
       from public.garage_bikes bike
       where bike.id = new.garage_bike_id
         and bike.owner_id = new.seller_id
         and bike.ownership_ended_on is null
         and bike.retired_on is null
     )
  then
    raise exception 'En annonce kan kun forbindes med en aktiv, ikke-pensioneret cykelregistrering fra sælgeren';
  end if;

  return new;
end;
$$;
