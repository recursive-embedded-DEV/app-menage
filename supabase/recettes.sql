-- =====================================================================
-- APP-M&M : les recettes dans Supabase (R1, partie 1 : le schéma)
-- À exécuter UNE FOIS dans Supabase → SQL Editor, AVANT recettes-donnees.sql.
--
-- Décisions (avec Mathieu) :
--   - lecture PUBLIQUE (comme quand les recettes étaient dans le code) ;
--   - ajout, modification, suppression : tous les MEMBRES du ménage ;
--   - les ingrédients peuvent être reliés à un aliment (FCEN ou perso).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------
create table public.recettes (
  -- Identifiant lisible, utilisé dans l'adresse : #/recettes/banh-mi
  id              text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titre           text not null check (length(trim(titre)) > 0),
  image           text not null default '',  -- fichier de public/img/ ; "" = aucune
  -- Durées en minutes ; 0 = l'étape n'existe pas (convention des zéros).
  preparation_min integer not null default 0 check (preparation_min >= 0),
  cuisson_min     integer not null default 0 check (cuisson_min >= 0),
  repos_min       integer not null default 0 check (repos_min >= 0),
  rendement       text not null default '',  -- texte affiché : « 8 à 10 tranches »
  portions        numeric not null check (portions > 0), -- base du calcul des quantités
  -- Étapes : [{ "section": "", "items": ["…", "…"] }] ; notes : ["…"].
  -- Des textes ordonnés, sans lien vers d'autres tables : jsonb suffit.
  etapes          jsonb not null default '[]'::jsonb check (jsonb_typeof(etapes) = 'array'),
  notes           jsonb not null default '[]'::jsonb check (jsonb_typeof(notes) = 'array'),
  auteur_id       uuid references auth.users(id) on delete set null default auth.uid(),
  cree_le         timestamptz not null default now(),
  modifie_le      timestamptz not null default now()
);

-- Une ligne par ingrédient. Une TABLE (et non du jsonb) pour que aliment_id
-- soit une vraie clé étrangère : impossible de supprimer un aliment utilisé.
create table public.ingredients_recette (
  id          bigint generated always as identity primary key,
  -- on update cascade : si l'identifiant d'une recette change un jour.
  recette_id  text not null references public.recettes(id) on delete cascade on update cascade,
  section     text not null default '',      -- sous-titre (« Pour la vinaigrette ») ; "" = aucun
  position    integer not null,              -- ordre d'affichage dans la recette
  nom         text not null check (length(trim(nom)) > 0),
  quantite    text not null default '',      -- texte affiché et ajusté : « 2 tasses »
  -- Lien nutrition (facultatif) : l'aliment et son poids pour la recette de base.
  aliment_id  bigint references public.aliments(id) on delete restrict,
  grammes     numeric check (grammes > 0),
  check ((aliment_id is null) = (grammes is null)), -- les deux, ou aucun
  unique (recette_id, position)
);

create index ingredients_recette_aliment on public.ingredients_recette (aliment_id);


-- ---------------------------------------------------------------------
-- 2. Sécurité (RLS)
-- ---------------------------------------------------------------------
alter table public.recettes enable row level security;
alter table public.ingredients_recette enable row level security;

-- Lecture : tout le monde, connecté ou non (anon).
create policy "recettes : lecture publique" on public.recettes
  for select to anon, authenticated using (true);
create policy "ingredients : lecture publique" on public.ingredients_recette
  for select to anon, authenticated using (true);

-- Écriture : les membres du ménage, quel que soit l'auteur de la recette.
create policy "recettes : écriture par les membres" on public.recettes
  for all to authenticated
  using ((select public.est_membre()))
  with check ((select public.est_membre()));
create policy "ingredients : écriture par les membres" on public.ingredients_recette
  for all to authenticated
  using ((select public.est_membre()))
  with check ((select public.est_membre()));


-- ---------------------------------------------------------------------
-- 3. Enregistrer une recette COMPLÈTE en une seule opération
-- La fonction remplace la recette et TOUS ses ingrédients dans une même
-- transaction : tout réussit, ou rien ne change (jamais une recette à moitié
-- enregistrée). « security invoker » (par défaut) : les règles RLS s'appliquent.
--
-- Paramètre : { id, titre, image, preparation_min, cuisson_min, repos_min,
--   rendement, portions, etapes, notes,
--   ingredients: [{ section, nom, quantite, aliment_id, grammes }, …] }
-- ---------------------------------------------------------------------
create function public.enregistrer_recette(recette jsonb)
returns text
language plpgsql
set search_path = ''
as $$
declare
  identifiant text := recette->>'id';
begin
  insert into public.recettes
    (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
  values (
    identifiant,
    recette->>'titre',
    coalesce(recette->>'image', ''),
    coalesce((recette->>'preparation_min')::integer, 0),
    coalesce((recette->>'cuisson_min')::integer, 0),
    coalesce((recette->>'repos_min')::integer, 0),
    coalesce(recette->>'rendement', ''),
    (recette->>'portions')::numeric,
    coalesce(recette->'etapes', '[]'::jsonb),
    coalesce(recette->'notes', '[]'::jsonb)
  )
  on conflict (id) do update set
    titre = excluded.titre,
    image = excluded.image,
    preparation_min = excluded.preparation_min,
    cuisson_min = excluded.cuisson_min,
    repos_min = excluded.repos_min,
    rendement = excluded.rendement,
    portions = excluded.portions,
    etapes = excluded.etapes,
    notes = excluded.notes,
    modifie_le = now();
    -- auteur_id et cree_le ne changent pas à la modification.

  -- Les ingrédients sont remplacés en bloc : plus simple et plus sûr que de
  -- calculer les ajouts, retraits et déplacements un par un.
  delete from public.ingredients_recette where recette_id = identifiant;

  insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes)
  select
    identifiant,
    coalesce(i->>'section', ''),
    rang,
    i->>'nom',
    coalesce(i->>'quantite', ''),
    (i->>'aliment_id')::bigint,
    (i->>'grammes')::numeric
  from jsonb_array_elements(coalesce(recette->'ingredients', '[]'::jsonb)) with ordinality as e(i, rang);

  return identifiant;
end;
$$;
