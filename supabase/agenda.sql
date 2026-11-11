-- =====================================================================
-- APP-M&M : Agenda (Google Agenda) — réglages par membre
-- À exécuter UNE FOIS dans Supabase → SQL Editor.
--
-- Les ÉVÉNEMENTS restent dans Google Agenda (rien n'est copié ici).
-- Cette table retient seulement, pour chaque membre, quel agenda Google
-- correspond à Mathieu, à Mariana et à la Famille : l'identifiant d'un même
-- agenda partagé est le même pour les deux comptes, mais chacun fait son
-- propre choix (et le retrouve sur tous ses appareils).
-- =====================================================================

create table public.preferences_agenda (
  user_id        uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  agenda_mathieu text, -- identifiant d'agenda Google ; NULL = non choisi
  agenda_mariana text,
  agenda_famille text
);

alter table public.preferences_agenda enable row level security;

-- Privé : chacun ne lit et ne modifie que SA ligne.
create policy "agenda : ses réglages" on public.preferences_agenda
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select public.est_membre()));
