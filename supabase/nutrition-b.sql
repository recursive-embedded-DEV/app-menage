-- =====================================================================
-- APP-M&M : module Nutrition — Phase B (profil, objectifs, journal)
-- À exécuter UNE FOIS dans Supabase → SQL Editor, après nutrition.sql.
--
-- Contrairement aux listes (partagées) et aux aliments (partagés), ces
-- données sont PRIVÉES : chaque membre ne voit que les siennes.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Profil nutrition : l'onglet est-il affiché ? quels objectifs ?
-- Une ligne par membre. Préférence et objectifs ensemble : ils appartiennent
-- au même membre et se lisent toujours ensemble.
-- Le TYPE d'objectif est fixé dans l'app (minimum pour les protéines,
-- maximum pour le reste), pas stocké.
-- ---------------------------------------------------------------------
create table public.profils_nutrition (
  user_id              uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  actif                boolean not null default false,
  -- NULL tant que l'objectif n'est pas défini.
  objectif_kcal        numeric check (objectif_kcal > 0),
  objectif_proteines_g numeric check (objectif_proteines_g > 0),
  objectif_glucides_g  numeric check (objectif_glucides_g > 0),
  objectif_lipides_g   numeric check (objectif_lipides_g > 0)
);


-- ---------------------------------------------------------------------
-- 2. Journal : un aliment consommé par ligne.
-- On stocke les GRAMMES (la vérité) ; calories et macros sont calculées dans
-- l'app à partir de l'aliment (données dérivées : jamais stockées).
-- ---------------------------------------------------------------------
create table public.journal (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade default auth.uid(),
  -- Jour LOCAL (Québec), calculé par l'app : une collation à 23 h 30 compte
  -- pour ce jour-là, même s'il est déjà le lendemain en UTC.
  date           date not null,
  repas          text not null check (repas in ('dejeuner', 'diner', 'souper', 'collation')),
  -- RESTRICT : impossible de supprimer un aliment perso déjà utilisé dans un
  -- journal (l'entrée pointerait vers un aliment disparu).
  aliment_id     bigint not null references public.aliments(id) on delete restrict,
  grammes        numeric not null check (grammes > 0),
  -- Ce que l'utilisateur a choisi, pour l'affichage : « 2 × 1 oeuf moyen », « 150 g ».
  quantite_texte text not null,
  cree_le        timestamptz not null default now()
);

-- La requête la plus fréquente : « mon journal de tel jour ».
create index journal_user_date on public.journal (user_id, date);
create index journal_aliment on public.journal (aliment_id);


-- ---------------------------------------------------------------------
-- 3. Sécurité (RLS) : chacun ne voit et ne modifie que SES lignes.
-- Écrire exige aussi d'être membre du ménage.
-- ---------------------------------------------------------------------
alter table public.profils_nutrition enable row level security;
alter table public.journal enable row level security;

create policy "profil : lecture du sien" on public.profils_nutrition
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "profil : création du sien" on public.profils_nutrition
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.est_membre()));

create policy "profil : modification du sien" on public.profils_nutrition
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "journal : lecture du sien" on public.journal
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "journal : ajout au sien" on public.journal
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.est_membre()));

create policy "journal : modification du sien" on public.journal
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "journal : suppression du sien" on public.journal
  for delete to authenticated
  using (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 4. Récents : les 10 derniers aliments DISTINCTS du journal du membre
-- connecté, du plus récent au plus ancien. Proposés avant toute recherche :
-- on mange souvent les mêmes choses.
-- « security invoker » (par défaut) : les RLS limitent au journal du membre.
-- ---------------------------------------------------------------------
create function public.aliments_recents()
returns setof public.aliments
language sql stable
set search_path = ''
as $$
  select a.*
  from public.aliments a
  join (
    select aliment_id, max(cree_le) as dernier
    from public.journal
    group by aliment_id
  ) j on j.aliment_id = a.id
  order by j.dernier desc
  limit 10;
$$;
