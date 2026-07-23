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
  purchase_date,
  owner_count,
  purchase_proof_available,
  service_history_available,
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
    '2022-05-14',
    1,
    true,
    true,
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
    '2023-08-02',
    1,
    true,
    true,
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
    '2023-03-18',
    2,
    false,
    true,
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
    '2018-06-10',
    3,
    false,
    false,
    'draft',
    null
  )
on conflict (id) do update
set
  title = excluded.title,
  price_dkk = excluded.price_dkk,
  description = excluded.description,
  purchase_date = excluded.purchase_date,
  owner_count = excluded.owner_count,
  purchase_proof_available = excluded.purchase_proof_available,
  service_history_available = excluded.service_history_available;

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

insert into public.listing_reports (
  id,
  reporter_id,
  listing_id,
  reason,
  details
)
values (
  'a0000000-0000-4000-8000-000000000001',
  'seed-seller-anna',
  '10000000-0000-4000-8000-000000000002',
  'suspected-scam',
  'Udviklingsrapport til test af moderatorens annoncekø.'
)
on conflict (id) do nothing;

insert into public.contact_requests (
  id,
  listing_id,
  buyer_id,
  seller_id,
  intent,
  buyer_email,
  message
)
values (
  'b0000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'seed-seller-anna',
  'seed-seller-mikkel',
  'viewing',
  'anna@example.invalid',
  'Jeg vil gerne se cyklen og høre, om en fremvisning i weekenden er mulig.'
)
on conflict (id) do nothing;

insert into public.contact_requests (
  id,
  listing_id,
  buyer_id,
  seller_id,
  intent,
  buyer_email,
  message,
  status,
  read_at
)
values (
  'b0000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  'seed-seller-anna',
  'seed-seller-mikkel',
  'offer',
  'anna@example.invalid',
  'Jeg vil gerne købe cyklen og har aftalt afhentning med sælgeren.',
  'read',
  now()
)
on conflict (id) do update
set
  status = 'read',
  read_at = now(),
  closed_at = null;

insert into public.listing_reservations (
  id,
  listing_id,
  contact_request_id,
  seller_id,
  buyer_id,
  status
)
values (
  'c0000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000004',
  'b0000000-0000-4000-8000-000000000002',
  'seed-seller-mikkel',
  'seed-seller-anna',
  'active'
)
on conflict (id) do update
set
  status = 'active',
  ended_by = null,
  ended_at = null;

insert into public.listing_status_events (
  id,
  listing_id,
  actor_id,
  from_status,
  to_status
)
values (
  'd0000000-0000-4000-8000-000000000018',
  '10000000-0000-4000-8000-000000000004',
  'seed-seller-mikkel',
  'published',
  'reserved'
)
on conflict (id) do nothing;

insert into public.listing_favorites (user_id, listing_id)
values (
  'seed-seller-anna',
  '10000000-0000-4000-8000-000000000002'
)
on conflict (user_id, listing_id) do nothing;

insert into public.listing_component_changes (
  id,
  listing_id,
  category,
  previous_component,
  replacement_brand,
  replacement_model,
  changed_on,
  notes,
  documentation_available
)
values
  (
    '90000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'chain',
    'Original Shimano-kæde',
    'Shimano',
    'CN-M8100 12-speed',
    '2026-03-12',
    'Udskiftet ved service og målt med kædemåler.',
    true
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    'tires',
    'Continental Ultra Sport',
    'Continental',
    'Grand Prix 5000 28 mm',
    '2026-04-05',
    'Begge dæk udskiftet og monteret med nye slanger.',
    false
  )
on conflict (id) do update
set
  replacement_brand = excluded.replacement_brand,
  replacement_model = excluded.replacement_model,
  notes = excluded.notes;

insert into public.garage_bikes (
  id,
  owner_id,
  nickname,
  category,
  brand,
  model,
  model_year,
  frame_size_label,
  serial_number_hash,
  acquired_on,
  acquired_used,
  owner_count_at_acquisition,
  current_odometer_km,
  notes
)
values (
  '70000000-0000-4000-8000-000000000001',
  'seed-seller-anna',
  'Sommer-raceren',
  'road',
  'Specialized',
  'Tarmac SL7 Comp',
  2022,
  '56 / L',
  encode(digest('development-garage-frame-1', 'sha256'), 'hex'),
  '2022-05-14',
  false,
  1,
  6840,
  'Bruges primært til træning og længere sommerture.'
)
on conflict (id) do update
set
  nickname = excluded.nickname,
  current_odometer_km = excluded.current_odometer_km,
  notes = excluded.notes;

update public.listings
set garage_bike_id = '70000000-0000-4000-8000-000000000001'
where id = '10000000-0000-4000-8000-000000000001';

insert into public.bike_log_entries (
  id,
  bike_id,
  log_type,
  title,
  details,
  occurred_on,
  distance_km,
  odometer_km,
  cost_dkk,
  component_category,
  component_brand,
  component_model,
  documentation_available
)
values
  (
    '80000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    'maintenance',
    'Forårsservice',
    'Bremser kontrolleret, gear justeret og bolte efterspændt med momentnøgle.',
    '2026-03-12',
    null,
    6410,
    850,
    null,
    null,
    null,
    true
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000001',
    'ride',
    'Lang tur omkring Aarhus',
    'Rolig træningstur i tørvejr.',
    '2026-07-18',
    94,
    6840,
    null,
    null,
    null,
    null,
    false
  )
on conflict (id) do update
set
  title = excluded.title,
  details = excluded.details,
  odometer_km = excluded.odometer_km;

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

update public.listings
set status = 'reserved'
where id = '10000000-0000-4000-8000-000000000004';

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

insert into public.forum_posts (
  id,
  category_slug,
  author_id,
  title,
  body,
  created_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    'cykelvalg-og-stoerrelse',
    'seed-seller-anna',
    'Er en størrelse 56 for stor til 178 cm?',
    'Jeg kigger på en endurance-cykel i størrelse 56. Min skridtlængde er cirka 83 cm, og jeg foretrækker en afslappet position. Hvilke mål bør jeg især sammenligne?',
    now() - interval '8 hours'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'vedligeholdelse',
    'seed-seller-mikkel',
    'Tjekliste før første forårstur',
    'Hvad gennemgår I på cyklen efter vinteren? Jeg tænker dæktryk, kæde og bremser, men vil gerne samle en kort og praktisk tjekliste.',
    now() - interval '1 day'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    'prisvurdering',
    'seed-seller-anna',
    'Hvordan vurderer I brugte carbonhjul?',
    'Jeg har svært ved at vurdere prisforskellen på hjul med og uden dokumenteret servicehistorik. Hvilke tegn på slid påvirker prisen mest?',
    now() - interval '2 days'
  )
on conflict (id) do update
set
  category_slug = excluded.category_slug,
  title = excluded.title,
  body = excluded.body;

insert into public.forum_comments (
  id,
  post_id,
  author_id,
  parent_id,
  body,
  created_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'seed-seller-mikkel',
    null,
    'Start med stack og reach frem for størrelsesnummeret alene. Sammenlign også med en cykel, du allerede sidder godt på.',
    now() - interval '7 hours'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000001',
    'seed-seller-anna',
    '50000000-0000-4000-8000-000000000001',
    'Tak, det giver mening. Jeg finder geometrimålene på min nuværende cykel først.',
    now() - interval '6 hours'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000002',
    'seed-seller-anna',
    null,
    'Jeg kontrollerer også dæksiderne for revner og efterspænder kun med momentnøgle, hvor producenten anbefaler det.',
    now() - interval '20 hours'
  )
on conflict (id) do update
set body = excluded.body;

insert into public.post_votes (post_id, user_id, value)
values
  ('40000000-0000-4000-8000-000000000001', 'seed-seller-mikkel', 1),
  ('40000000-0000-4000-8000-000000000002', 'seed-seller-anna', 1)
on conflict (post_id, user_id) do update
set value = excluded.value;

insert into public.comment_votes (comment_id, user_id, value)
values
  ('50000000-0000-4000-8000-000000000001', 'seed-seller-anna', 1)
on conflict (comment_id, user_id) do update
set value = excluded.value;

insert into public.content_reports (
  id,
  reporter_id,
  post_id,
  reason,
  details
)
values (
  '60000000-0000-4000-8000-000000000001',
  'seed-seller-anna',
  '40000000-0000-4000-8000-000000000002',
  'other',
  'Udviklingsrapport til test af moderator-køen.'
)
on conflict (id) do nothing;
