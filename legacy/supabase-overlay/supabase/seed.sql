insert into public.forum_categories (slug, name, description, position)
values
  ('koebshjaelp', 'Købshjælp', 'Hjælp til at vælge og vurdere en brugt racercykel.', 10),
  ('cykelvalg-og-stoerrelse', 'Cykelvalg og størrelse', 'Geometri, størrelse og bike fit.', 20),
  ('udstyr-og-komponenter', 'Udstyr og komponenter', 'Geargrupper, hjul, dæk, pedaler og andet udstyr.', 30),
  ('vedligeholdelse', 'Vedligeholdelse', 'Service, reparationer og fejlfinding.', 40),
  ('prisvurdering', 'Prisvurdering', 'Få input til en rimelig købs- eller salgspris.', 50),
  ('traening-og-ture', 'Træning og ture', 'Ruter, træning og erfaringer på cyklen.', 60),
  ('svindel-og-stjaalne-cykler', 'Svindel og stjålne cykler', 'Advarsler, mønstre og hjælp ved mistanke.', 70),
  ('platform-feedback', 'Feedback til platformen', 'Forslag og fejl på sitet.', 80)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position;
