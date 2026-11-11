-- =====================================================================
-- APP-M&M : schéma de la base Supabase (module Listes)
-- À exécuter UNE FOIS dans Supabase → SQL Editor.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- Membres du ménage : seuls les comptes listés ici ont accès aux listes.
-- user_id pointe vers la table des comptes gérée par Supabase (auth.users).
create table public.membres (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prenom  text not null
);

-- Une liste est soit une liste d'articles, soit une liste de livres
-- (même union discriminée que le type `Liste` en TypeScript).
create table public.listes (
  id      text primary key,   -- identifiant lisible, utilisé dans l'adresse : #/listes/epicerie
  titre   text not null,
  type    text not null check (type in ('articles', 'livres')),
  cree_le timestamptz not null default clock_timestamp(),
  unique (id, type)           -- cible des clés étrangères composées ci-dessous
);

-- La clé étrangère composée (liste_id, type_liste) garantit qu'un article
-- ne peut appartenir QU'À une liste de type 'articles'.
create table public.articles (
  id         uuid primary key default gen_random_uuid(),
  liste_id   text not null,
  type_liste text not null default 'articles' check (type_liste = 'articles'),
  texte      text not null,
  coche      boolean not null default false,
  cree_le    timestamptz not null default clock_timestamp(),  -- sert à l'ordre d'affichage
  foreign key (liste_id, type_liste) references public.listes(id, type) on delete cascade
);

-- Même principe pour les livres. Les champs facultatifs valent "" plutôt
-- que NULL, comme dans le type TypeScript `Livre`.
create table public.livres (
  id         uuid primary key default gen_random_uuid(),
  liste_id   text not null,
  type_liste text not null default 'livres' check (type_liste = 'livres'),
  titre      text not null,
  auteur     text not null default '',
  lien       text not null default '',  -- lien Amazon
  isbn       text not null default '',  -- chiffres seulement
  image      text not null default '',  -- fichier dans public/img/ ; "" → couverture Open Library
  cree_le    timestamptz not null default clock_timestamp(),
  foreign key (liste_id, type_liste) references public.listes(id, type) on delete cascade
);

-- Index : accélèrent la recherche des articles et des livres d'une liste.
create index on public.articles (liste_id);
create index on public.livres (liste_id);


-- ---------------------------------------------------------------------
-- 2. Sécurité : Row Level Security (RLS)
-- Sans politique explicite, une table protégée par RLS ne renvoie RIEN.
-- Aucune politique n'est prévue pour le rôle `anon` (non connecté).
-- ---------------------------------------------------------------------

-- Vrai si l'utilisateur connecté fait partie du ménage.
-- La même condition sert dans 3 tables, donc on l'extrait dans une fonction.
create function public.est_membre()
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (select 1 from public.membres where user_id = (select auth.uid()));
$$;

alter table public.membres  enable row level security;
alter table public.listes   enable row level security;
alter table public.articles enable row level security;
alter table public.livres   enable row level security;

-- Chacun ne voit que sa propre fiche, ce qui suffit à est_membre().
-- Aucune politique d'écriture : les membres s'ajoutent dans le SQL Editor.
create policy "membres : sa propre fiche" on public.membres
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Les membres du ménage peuvent tout faire (lire, ajouter, modifier, supprimer).
-- Le (select …) fait évaluer la fonction une seule fois par requête.
create policy "listes : membres seulement" on public.listes
  for all to authenticated
  using ((select public.est_membre()))
  with check ((select public.est_membre()));

create policy "articles : membres seulement" on public.articles
  for all to authenticated
  using ((select public.est_membre()))
  with check ((select public.est_membre()));

create policy "livres : membres seulement" on public.livres
  for all to authenticated
  using ((select public.est_membre()))
  with check ((select public.est_membre()));


-- ---------------------------------------------------------------------
-- 3. Temps réel
-- Supabase diffuse les changements des tables ajoutées à cette
-- « publication ». Les règles RLS s'appliquent aussi aux événements.
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.articles, public.livres;
