create or replace function public.normalize_linked_bike_nickname()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.registry_id is not null and char_length(new.nickname) > 80 then
    new.nickname = left(new.nickname, 80);
  end if;
  return new;
end;
$$;

create trigger garage_bikes_normalize_linked_nickname
before insert on public.garage_bikes
for each row execute function public.normalize_linked_bike_nickname();
