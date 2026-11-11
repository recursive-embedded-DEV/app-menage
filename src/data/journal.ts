import type { Aliment } from '../types/aliment'
import type { ChangementsEntree, EntreeJournal, NouvelleEntree } from '../types/journal'
import { COLONNES_ALIMENT } from './aliments'
import { supabase } from './supabase'

// Le SEUL fichier qui sait où est le journal : la table public.journal.
// Les règles RLS limitent tout au journal du membre connecté : aucune
// requête n'a besoin de filtrer par user_id.

// « aliment:aliments(…) » : PostgREST suit la clé étrangère aliment_id et
// imbrique l'aliment complet dans chaque entrée (une seule requête).
const COLONNES = `id, date, repas, grammes, quantite_texte, aliment:aliments(${COLONNES_ALIMENT})`

export async function chargerJournal(date: string): Promise<EntreeJournal[]> {
  const { data, error } = await supabase.from('journal').select(COLONNES).eq('date', date).order('cree_le')
  if (error) throw error
  return data as unknown as EntreeJournal[]
}

// Renvoie l'entrée créée, avec son aliment : l'écran l'affiche telle quelle.
export async function ajouterEntree(entree: NouvelleEntree): Promise<EntreeJournal> {
  const { data, error } = await supabase.from('journal').insert(entree).select(COLONNES).single()
  if (error) throw error
  return data as unknown as EntreeJournal
}

export async function modifierEntree(id: string, changements: ChangementsEntree): Promise<EntreeJournal> {
  const { data, error } = await supabase.from('journal').update(changements).eq('id', id).select(COLONNES).single()
  if (error) throw error
  return data as unknown as EntreeJournal
}

export async function supprimerEntree(id: string): Promise<void> {
  const { error } = await supabase.from('journal').delete().eq('id', id)
  if (error) throw error
}

// Fonction SQL aliments_recents (supabase/nutrition-b.sql).
export async function alimentsRecents(): Promise<Aliment[]> {
  const { data, error } = await supabase.rpc('aliments_recents').select(COLONNES_ALIMENT)
  if (error) throw error
  return data as Aliment[]
}
