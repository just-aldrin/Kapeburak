insert into public.products (
  id, name, category, description, note, price_centavos, options, featured, sort_order
) values
  ('spanish-latte', 'Kapeburak Spanish Latte', 'Coffee', 'Two ristretto shots, sweet condensed milk, chilled velvety fresh milk, and cinnamon.', 'Our signature pour', 18500, array['Iced', 'Hot'], true, 1),
  ('tultul-latte', 'Guimaras Tultul Latte', 'Coffee', 'Velvety latte layered with artisanal Guimaras tultul heirloom sea salt.', 'Sweet + savory', 19500, array['Iced', 'Hot'], false, 2),
  ('liberica-cloud', 'Batangas Liberica Cloud', 'Coffee', 'Heritage Liberica espresso floated above aerated vanilla bean cloud foam.', 'Bold + floral', 20500, array['Iced', 'Hot'], false, 3),
  ('ube-cruffin', 'Bohol Ube Cruffin', 'Pastry', '27-layer laminated French butter pastry with ube halaya and three-milk cream.', 'Baked this morning', 16500, array[]::text[], false, 4),
  ('cold-steep', '18H Cold Steep', 'Bottled', 'A slow-steeped cafe-grade brew with dark caramel and cacao notes.', 'Keep chilled', 21000, array['250ml', '500ml'], false, 5),
  ('atok-honey', 'Atok Honeydark Beans', 'Pantry', 'Freshly roasted Benguet beans with wild honey sweetness and a dark chocolate finish.', '250g · whole bean', 42000, array['Whole bean', 'Ground'], false, 6),
  ('field-notes-tumbler', 'Field Notes Tumbler', 'Goods', 'A double-wall thermal tumbler for slow mornings, long drives, and everything between.', '12oz · matte clay', 78000, array[]::text[], false, 7),
  ('panaderia-toast', 'Panaderia Morning Toast', 'Pastry', 'Griddled brioche, cultured butter, muscovado sugar, and a pinch of sea salt.', 'Best with espresso', 14500, array[]::text[], false, 8)
on conflict (id) do nothing;
