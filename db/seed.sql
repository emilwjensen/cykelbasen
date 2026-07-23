insert into public.profiles (id, display_name, city)
values
  ('seed-seller-anna', 'Anna M.', 'Aarhus'),
  ('seed-seller-mikkel', 'Mikkel R.', 'København'),
  ('seed-moderator', 'Cykelbasen moderation', 'Odense')
on conflict (id) do update
set display_name = excluded.display_name, city = excluded.city;

insert into public.moderators (user_id)
values ('seed-moderator')
on conflict (user_id) do nothing;

insert into public.listings (
  id,
  seller_id,
  title,
  category,
  brand,
  model,
  model_year,
  frame_size_label,
  frame_size_cm,
  material,
  groupset_brand,
  groupset_model,
  drivetrain,
  brakes,
  wheel_size,
  electronic_shifting,
  shipping_offered,
  price_dkk,
  condition,
  city,
  description,
  status,
  published_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'seed-seller-anna',
    'Specialized Tarmac SL7 Comp',
    'road',
    'Specialized',
    'Tarmac SL7 Comp',
    2022,
    '56 / L',
    56,
    'carbon',
    'Shimano',
    'Ultegra Di2',
    '2x12',
    'disc-hydraulic',
    '700c',
    true,
    false,
    28500,
    'excellent',
    'Aarhus',
    'Velholdt og hurtig allround-racer med elektronisk gearskifte. Cyklen er serviceret før sæsonen og sælges, fordi størrelsen ikke passer mig optimalt.',
    'draft',
    null
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'seed-seller-mikkel',
    'Canyon Grail CF SL 7',
    'gravel',
    'Canyon',
    'Grail CF SL 7',
    2023,
    'M',
    55.5,
    'carbon',
    'Shimano',
    'GRX 810',
    '2x11',
    'disc-hydraulic',
    '700c',
    false,
    true,
    21400,
    'like-new',
    'København',
    'Let carbon-gravelcykel med få brugsspor og tubeless-hjul. Kvittering og stelnummer er dokumenteret, og cyklen kan sendes efter aftale.',
    'draft',
    null
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'seed-seller-anna',
    'Cannondale CAAD13 105',
    'road',
    'Cannondale',
    'CAAD13 105',
    2021,
    '54 / M',
    54,
    'aluminium',
    'Shimano',
    '105 R7000',
    '2x11',
    'disc-hydraulic',
    '700c',
    false,
    true,
    11200,
    'good',
    'Aarhus',
    'Kvikk aluminiumscykel med carbonforgaffel. Normale kosmetiske brugsspor, men mekanisk i god stand med ny kæde og bremseklodser.',
    'draft',
    null
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'seed-seller-mikkel',
    'Colnago Master Olympic',
    'vintage',
    'Colnago',
    'Master Olympic',
    1996,
    '57',
    57,
    'steel',
    'Campagnolo',
    'Chorus',
    '2x8',
    'rim',
    '700c',
    false,
    false,
    16800,
    'used',
    'Odense',
    'Klassisk italiensk stålramme med original lak og tidstypisk Campagnolo-gruppe. Patina efter alder, men ingen buler eller kendte strukturelle skader.',
    'draft',
    null
  )
on conflict (id) do update
set
  title = excluded.title,
  price_dkk = excluded.price_dkk,
  description = excluded.description;

insert into public.ownership_documents (
  id,
  listing_id,
  owner_id,
  object_key,
  frame_number_hash,
  status,
  review_note,
  reviewed_by,
  reviewed_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'seed-seller-anna',
    'development-only/10000000-0000-4000-8000-000000000001/sample.pdf',
    encode(digest('development-frame-1', 'sha256'), 'hex'),
    'approved',
    'Udviklingsdata',
    'seed-moderator',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'seed-seller-mikkel',
    'development-only/10000000-0000-4000-8000-000000000002/sample.pdf',
    encode(digest('development-frame-2', 'sha256'), 'hex'),
    'approved',
    'Udviklingsdata',
    'seed-moderator',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'seed-seller-anna',
    'development-only/10000000-0000-4000-8000-000000000003/sample.pdf',
    encode(digest('development-frame-3', 'sha256'), 'hex'),
    'approved',
    'Udviklingsdata',
    'seed-moderator',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    'seed-seller-mikkel',
    'development-only/10000000-0000-4000-8000-000000000004/sample.pdf',
    encode(digest('development-frame-4', 'sha256'), 'hex'),
    'approved',
    'Udviklingsdata',
    'seed-moderator',
    now()
  )
on conflict (id) do nothing;

update public.listings
set
  status = 'published',
  published_at = case id
    when '10000000-0000-4000-8000-000000000001' then now() - interval '2 days'
    when '10000000-0000-4000-8000-000000000002' then now() - interval '5 days'
    when '10000000-0000-4000-8000-000000000003' then now() - interval '9 days'
    else now() - interval '14 days'
  end
where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004'
);

insert into public.listing_images (
  id,
  listing_id,
  object_key,
  image_url,
  alt_text,
  position,
  width,
  height
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'development-only/tarmac-cover',
    'https://images.unsplash.com/photo-1718548325164-9abb9225e65e?auto=format&fit=crop&w=1600&q=85',
    'Hvid racercykel op ad en lys mur',
    0,
    1600,
    1067
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'development-only/grail-cover',
    'https://images.unsplash.com/photo-1526359395878-56f9a884ea5a?auto=format&fit=crop&w=1600&q=85',
    'Racercykel på en rolig landevej i aftensol',
    0,
    1600,
    1067
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'development-only/caad-cover',
    'https://images.unsplash.com/photo-1718548325164-9abb9225e65e?auto=format&fit=crop&w=1600&q=85',
    'Racercykel fotograferet fra siden',
    0,
    1600,
    1067
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    'development-only/colnago-cover',
    'https://images.unsplash.com/photo-1526359395878-56f9a884ea5a?auto=format&fit=crop&w=1600&q=85',
    'Klassisk racercykel i gyldent lys',
    0,
    1600,
    1067
  )
on conflict (id) do update
set
  image_url = excluded.image_url,
  alt_text = excluded.alt_text;

