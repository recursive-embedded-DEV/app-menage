-- =====================================================================
-- APP-M&M : contenu de départ des listes
-- Reprend src/data/listes-initiales.ts. À exécuter UNE FOIS, après schema.sql.
-- Les identifiants des articles et des livres sont générés par la base (UUID).
-- =====================================================================

insert into public.listes (id, titre, type) values
  ('epicerie', 'Épicerie',      'articles'),
  ('livres',   'Livres à lire', 'livres');

insert into public.articles (liste_id, texte) values
  ('epicerie', 'Lait'),
  ('epicerie', 'Pain'),
  ('epicerie', 'Œufs'),
  ('epicerie', 'Café');

insert into public.livres (liste_id, titre, auteur, lien, isbn, image) values
  ('livres', 'Hidden Potential',            'Adam Grant',                    'https://www.amazon.ca/dp/0593653661', '0593653661', 'hidden-potential.jpg'),
  ('livres', 'Turn the Ship Around!',       'L. David Marquet',              'https://www.amazon.ca/dp/0241250943', '0241250943', 'turn-ship-around.jpg'),
  ('livres', 'The Psychology of Money',     'Morgan Housel',                 'https://www.amazon.ca/dp/0857197681', '0857197681', 'psychology-money.jpg'),
  ('livres', 'Indistractable',              'Nir Eyal',                      'https://www.amazon.ca/dp/1637747829', '1637747829', 'indistractable.jpg'),
  ('livres', 'Four Thousand Weeks',         'Oliver Burkeman',               'https://www.amazon.ca/dp/0735232482', '0735232482', 'four-thousand-weeks.jpg'),
  ('livres', 'How Innovation Works',        'Matt Ridley',                   'https://www.amazon.ca/dp/0062916602', '0062916602', 'how-innovation-works.jpg'),
  ('livres', 'Bulletproof Problem Solving', 'Charles Conn et Robert McLean', '',                                    '',           'bulletproof-problem-solving.jpg');
