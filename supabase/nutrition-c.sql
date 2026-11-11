-- =====================================================================
-- APP-M&M : module Nutrition — Phase C (légumes libres)
-- À exécuter UNE FOIS dans Supabase → SQL Editor, après nutrition-b.sql.
--
-- Règle décidée avec Mathieu : les LÉGUMES ne comptent ni dans les calories
-- ni dans les macros (journal ET recettes), SAUF les féculents, les
-- légumineuses et les légumes riches en gras (frits, sautés…). L'avocat et
-- les olives sont dans le groupe « Fruits » du FCEN : ils restent comptés.
-- =====================================================================

-- 1. Une colonne par aliment : calculée une fois ici, lue telle quelle par l'app.
alter table public.aliments
  add column legume_libre boolean not null default false;

-- 2. La règle, appliquée aux aliments du FCEN. Un légume est libre si :
--    - il est dans le groupe « Légumes et produits végétaux » ;
--    - il a MOINS de 100 kcal / 100 g (les légumes frits, sautés dans le gras
--      ou déshydratés restent comptés, l'ail aussi) ;
--    - son nom n'est pas celui d'un féculent ou d'une légumineuse.
--    \m et \M : début et fin de mot (« mais » ne doit pas trouver « maison »).
--    Les courges d'hiver (Butternut…) sont libres : décision de Mathieu.
--    Les aliments perso : case « Légume non compté » dans l'app.
update public.aliments
set legume_libre = true
where source = 'fcen'
  and groupe = 'Légumes et produits végétaux'
  and kcal < 100
  and nom_normalise !~ (
    'pomme de terre|pommes de terre|patate|\mmais\M|pois verts|petits pois|panais'
    || '|igname|manioc|taro|plantain|\mfeves?\M|edamame|haricots? (de )?lima'
    || '|lentille|pois chiche|frit'
  );

-- 3. Les fonctions qui renvoient des aliments sont recréées à l'identique :
--    elles renvoient ainsi la nouvelle colonne avec certitude.
create or replace function public.rechercher_aliments(texte text)
returns setof public.aliments
language sql stable
set search_path = ''
as $$
  with mots as (
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

create or replace function public.aliments_recents()
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

-- 4. Contrôle (à lire dans le résultat) : environ 541 légumes libres attendus.
select count(*) filter (where legume_libre) as legumes_libres,
       count(*) filter (where groupe = 'Légumes et produits végétaux' and not legume_libre) as legumes_comptes
from public.aliments;
