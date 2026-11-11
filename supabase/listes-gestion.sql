-- =====================================================================
-- APP-M&M : gestion des listes (créer, renommer, supprimer) et livres
-- catégorisés. À exécuter UNE FOIS dans Supabase → SQL Editor.
-- =====================================================================

-- 1. Catégorie d'un livre : texte libre (« Leadership », « Finances »…).
--    "" = sans catégorie (affiché sous « Autres »). Une colonne suffit pour
--    regrouper ; une table de catégories serait plus lourde pour rien.
alter table public.livres
  add column categorie text not null default '';

-- 2. Temps réel : une liste créée, renommée ou supprimée sur un téléphone
--    apparaît aussitôt sur l'autre (jusqu'ici, seuls articles et livres étaient
--    diffusés). Les règles RLS s'appliquent aussi aux événements.
alter publication supabase_realtime add table public.listes;

-- Les règles RLS de schema.sql (« listes : membres seulement », pour toutes
-- les opérations) permettent déjà de créer, renommer et supprimer une liste.
-- Supprimer une liste supprime son contenu (on delete cascade, schema.sql).
