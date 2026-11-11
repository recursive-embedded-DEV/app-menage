-- =====================================================================
-- APP-M&M : photos des recettes (R4) — Supabase Storage
-- À exécuter UNE FOIS dans Supabase → SQL Editor, après recettes.sql.
-- =====================================================================

-- 1. Le compartiment (« bucket »). public = true : chaque image a une adresse
--    publique, lisible sans connexion (comme les recettes elles-mêmes).
--    file_size_limit : 2 Mo, largement assez pour une photo réduite par l'app
--    (≈ 50 à 150 ko) ; refuse un envoi accidentel de photo brute.
--    allowed_mime_types : seulement des images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images-recettes', 'images-recettes', true, 2097152, array['image/webp', 'image/jpeg', 'image/png']);

-- 2. Écriture : les membres du ménage seulement (déposer, remplacer, supprimer).
--    La lecture publique vient du réglage public du compartiment.
create policy "images-recettes : dépôt par les membres" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images-recettes' and (select public.est_membre()));

create policy "images-recettes : modification par les membres" on storage.objects
  for update to authenticated
  using (bucket_id = 'images-recettes' and (select public.est_membre()));

create policy "images-recettes : suppression par les membres" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images-recettes' and (select public.est_membre()));
