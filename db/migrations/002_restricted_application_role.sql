do $$
begin
  if not exists (
    select 1 from pg_roles where rolname = 'cykelbasen_app'
  ) then
    create role cykelbasen_app
      nologin
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit
      nobypassrls;
  end if;
end
$$;

grant usage on schema public to cykelbasen_app;

grant select, insert, update on public.profiles to cykelbasen_app;
grant select, insert, update, delete on public.listings to cykelbasen_app;
grant select, insert, update, delete on public.listing_images to cykelbasen_app;
grant select, insert, update on public.ownership_documents to cykelbasen_app;

grant usage on type
  public.bike_category,
  public.listing_condition,
  public.frame_material,
  public.brake_type,
  public.listing_status,
  public.document_status
to cykelbasen_app;

grant execute on function public.current_app_user_id() to cykelbasen_app;
grant execute on function public.is_moderator(text) to cykelbasen_app;

alter default privileges in schema public
grant select, insert, update, delete on tables to cykelbasen_app;

