-- =====================================================================
-- APP-M&M : listes PARTAGÉES ou PERSONNELLES
-- À exécuter UNE FOIS dans Supabase → SQL Editor.
--
-- Une liste partagée (proprietaire_id vide) est visible par tout le ménage,
-- comme avant. Une liste personnelle n'est visible QUE par son propriétaire :
-- c'est la BASE qui l'impose (RLS), pas seulement l'affichage de l'app.
-- =====================================================================

-- 1. Propriétaire : NULL = partagée ; sinon, le membre à qui elle appartient.
--    on delete cascade : si un compte est supprimé, ses listes personnelles aussi.
alter table public.listes
  add column proprietaire_id uuid references auth.users(id) on delete cascade;

-- L'Épicerie reste TOUJOURS partagée : les recettes y ajoutent des ingrédients.
alter table public.listes
  add constraint listes_epicerie_partagee check (id <> 'epicerie' or proprietaire_id is null);

-- 2. « Livres à lire » devient la liste personnelle de Mathieu (décision de Mathieu).
update public.listes
set proprietaire_id = (select user_id from public.membres where prenom = 'Mathieu')
where id = 'livres';

-- 3. Une liste est-elle visible pour le membre connecté ? (partagée, ou à lui)
--    Sert aux règles des articles et des livres. « security invoker » (par
--    défaut) : la lecture de listes passe elle-même par ses règles RLS.
create function public.peut_acceder_liste(liste text)
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1 from public.listes l
    where l.id = liste
      and (l.proprietaire_id is null or l.proprietaire_id = (select auth.uid()))
  );
$$;

-- 4. Règles des LISTES : membres du ménage, et liste partagée ou à soi.
--    with check : on ne peut créer (ou rendre personnelle) une liste qu'à SON nom.
drop policy "listes : membres seulement" on public.listes;

create policy "listes : partagées ou à soi" on public.listes
  for all to authenticated
  using (
    (select public.est_membre())
    and (proprietaire_id is null or proprietaire_id = (select auth.uid()))
  )
  with check (
    (select public.est_membre())
    and (proprietaire_id is null or proprietaire_id = (select auth.uid()))
  );

-- 5. Règles des ARTICLES et des LIVRES : ceux d'une liste visible seulement.
drop policy "articles : membres seulement" on public.articles;
drop policy "livres : membres seulement" on public.livres;

create policy "articles : liste visible" on public.articles
  for all to authenticated
  using ((select public.est_membre()) and public.peut_acceder_liste(liste_id))
  with check ((select public.est_membre()) and public.peut_acceder_liste(liste_id));

create policy "livres : liste visible" on public.livres
  for all to authenticated
  using ((select public.est_membre()) and public.peut_acceder_liste(liste_id))
  with check ((select public.est_membre()) and public.peut_acceder_liste(liste_id));

-- Temps réel : les événements respectent aussi ces règles (un membre ne reçoit
-- pas les changements d'une liste personnelle de l'autre). Exception connue de
-- Supabase : une SUPPRESSION est signalée à tous, avec seulement l'identifiant
-- de la ligne (aucun contenu) ; l'app se contente alors de recharger.

-- 6. Contrôle : la liste « livres » doit appartenir à Mathieu.
select l.id, l.titre, coalesce(m.prenom, '(partagée)') as proprietaire
from public.listes l
left join public.membres m on m.user_id = l.proprietaire_id
order by l.cree_le;
