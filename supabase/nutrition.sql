-- =====================================================================
-- APP-M&M : module Nutrition — Phase A (base d'aliments)
-- À exécuter UNE FOIS dans Supabase → SQL Editor, après schema.sql
-- (réutilise la fonction public.est_membre()).
--
-- Source des aliments génériques : Fichier canadien sur les éléments
-- nutritifs (FCEN), Santé Canada, 2026. Licence du gouvernement ouvert – Canada.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Extensions de recherche
--   unaccent : « oeuf » trouve « Œuf », « creme » trouve « Crème »
--   pg_trgm  : index qui accélère la recherche par morceau de mot (« ri » → riz)
-- Supabase recommande de les installer dans le schéma « extensions ».
-- ---------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Texte en minuscules et sans accents. Déclarée IMMUTABLE (même entrée → même
-- sortie) pour pouvoir servir dans une colonne générée et un index ; c'est
-- pourquoi le dictionnaire unaccent est nommé explicitement.
create function public.normaliser(texte text)
returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, texte));
$$;


-- ---------------------------------------------------------------------
-- 2. Table des aliments
-- Valeurs nutritives POUR 100 G. Les valeurs d'une quantité donnée sont
-- calculées dans l'app (jamais stockées).
-- ---------------------------------------------------------------------
create table public.aliments (
  id          bigint generated always as identity primary key,
  source      text not null default 'perso' check (source in ('fcen', 'perso')),
  code_fcen   integer unique,             -- code de l'aliment dans le FCEN ; NULL pour un aliment perso
  nom         text not null check (length(trim(nom)) > 0),
  groupe      text not null default '',   -- groupe d'aliments du FCEN (« Produits laitiers et d'oeufs »)
  kcal        numeric not null check (kcal >= 0),
  proteines_g numeric not null check (proteines_g >= 0),
  glucides_g  numeric not null check (glucides_g >= 0),
  lipides_g   numeric not null check (lipides_g >= 0),
  -- Mesures de cuisine : [{"nom": "1 tasse", "g": 158}, …]. Toujours lues avec
  -- leur aliment : une colonne JSON évite une 2e table et une jointure.
  mesures     jsonb not null default '[]'::jsonb check (jsonb_typeof(mesures) = 'array'),
  -- Auteur d'un aliment perso ; rempli automatiquement avec le compte connecté.
  auteur_id   uuid references auth.users(id) on delete cascade default auth.uid(),
  cree_le     timestamptz not null default now(),
  -- Version du nom sans accents ni majuscules, tenue à jour par PostgreSQL.
  nom_normalise text generated always as (public.normaliser(nom)) stored,

  -- Cohérence : un aliment du FCEN a un code ; un aliment perso a un auteur.
  check ((source = 'fcen') = (code_fcen is not null)),
  check (source = 'fcen' or auteur_id is not null)
);

create index aliments_nom_trgm on public.aliments using gin (nom_normalise extensions.gin_trgm_ops);


-- ---------------------------------------------------------------------
-- 3. Sécurité (RLS)
-- Les aliments sont PARTAGÉS par le ménage (un aliment créé par Mathieu sert
-- aussi à Mariana). Les journaux, eux, seront privés (Phase B).
-- Le FCEN est en lecture seule ; chacun gère ses propres aliments perso.
-- ---------------------------------------------------------------------
alter table public.aliments enable row level security;

create policy "aliments : lecture par les membres" on public.aliments
  for select to authenticated
  using ((select public.est_membre()));

create policy "aliments : création d'aliments perso" on public.aliments
  for insert to authenticated
  with check ((select public.est_membre()) and source = 'perso' and auteur_id = (select auth.uid()));

create policy "aliments : modification de ses aliments perso" on public.aliments
  for update to authenticated
  using (source = 'perso' and auteur_id = (select auth.uid()))
  with check (source = 'perso' and auteur_id = (select auth.uid()));

create policy "aliments : suppression de ses aliments perso" on public.aliments
  for delete to authenticated
  using (source = 'perso' and auteur_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 4. Recherche
-- « riz blanc cuit » : chaque mot doit apparaître dans le nom, dans n'importe
-- quel ordre (« Riz, blanc, à grain long, cuit »). Les caractères autres que
-- lettres et chiffres sont ignorés (ce qui neutralise aussi % et _ de LIKE).
-- Ordre : aliments perso d'abord, puis les noms qui COMMENCENT par le 1er mot,
-- puis les noms les plus courts (souvent les plus génériques).
-- Fonction « security invoker » (par défaut) : les règles RLS s'appliquent.
-- ---------------------------------------------------------------------
create function public.rechercher_aliments(texte text)
returns setof public.aliments
language sql stable
set search_path = ''
as $$
  with mots as (
    -- WITH ORDINALITY numérote les mots : on sait lequel a été tapé en premier.
    select m.mot, m.rang
    from regexp_split_to_table(
      trim(regexp_replace(public.normaliser(texte), '[^a-z0-9]+', ' ', 'g')), ' '
    ) with ordinality as m(mot, rang)
    where m.mot <> ''
  )
  select a.*
  from public.aliments a
  where exists (select 1 from mots)
    and not exists (
      select 1 from mots where a.nom_normalise not like '%' || mots.mot || '%'
    )
  order by
    (a.source = 'perso') desc,
    (a.nom_normalise like (select mot from mots order by rang limit 1) || '%') desc,
    length(a.nom),
    a.nom
  limit 20;
$$;
