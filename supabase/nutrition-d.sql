-- =====================================================================
-- APP-M&M : module Nutrition — Phase D (une recette dans le journal)
-- À exécuter UNE FOIS dans Supabase → SQL Editor, après nutrition-c.sql.
--
-- Une entrée du journal est maintenant SOIT un aliment (+ grammes),
-- SOIT une recette (+ nombre de portions). Les valeurs d'une recette sont
-- calculées dans l'app à partir de ses ingrédients (jamais stockées).
-- =====================================================================

-- Aliment et grammes deviennent facultatifs (absents pour une recette).
alter table public.journal alter column aliment_id drop not null;
alter table public.journal alter column grammes drop not null;

-- Recette : son identifiant dans src/data/recettes.json (ex. « banh-mi »).
-- Pas de clé étrangère possible : les recettes ne sont pas (encore) dans la base.
alter table public.journal add column recette_id text;
alter table public.journal add column portions numeric check (portions > 0);

-- Exactement l'un des deux : un aliment avec ses grammes, OU une recette avec
-- ses portions. Union discriminée, garantie par la base.
alter table public.journal add constraint journal_aliment_ou_recette check (
  (aliment_id is not null and grammes is not null and recette_id is null and portions is null)
  or
  (aliment_id is null and grammes is null and recette_id is not null and portions is not null)
);

-- Les règles RLS (lignes du membre seulement) et aliments_recents() n'ont pas
-- à changer : la jointure des Récents ignore déjà les lignes sans aliment.
