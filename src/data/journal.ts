import type { Aliment } from '../types/aliment'
import type { ChangementsEntree, EntreeJournal, NouvelleEntree, Repas } from '../types/journal'
import { COLONNES_ALIMENT } from './aliments'
import { supabase } from './supabase'

// Le SEUL fichier qui sait où est le journal : la table public.journal.
// Les règles RLS limitent tout au journal du membre connecté : aucune
// requête n'a besoin de filtrer par user_id.

// « aliment:aliments(…) » : PostgREST suit la clé étrangère aliment_id et
// imbrique l'aliment (null pour une entrée « recette »).
const COLONNES = `id, date, repas, quantite_texte, grammes, recette_id, portions, aliment:aliments(${COLONNES_ALIMENT})`

// Forme brute d'une ligne renvoyée par Supabase.
interface LigneJournal {
  id: string
  date: string
  repas: Repas
  quantite_texte: string
  grammes: number | null
  recette_id: string | null
  portions: number | null
  aliment: Aliment | null
}

// Ligne brute → union discriminée (la base garantit qu'il y a l'un OU l'autre).
function versEntree(l: LigneJournal): EntreeJournal {
  const commun = { id: l.id, date: l.date, repas: l.repas, quantite_texte: l.quantite_texte }
  return l.aliment
    ? { ...commun, type: 'aliment', aliment: l.aliment, grammes: Number(l.grammes) }
    : { ...commun, type: 'recette', recette_id: String(l.recette_id), portions: Number(l.portions) }
}

export async function chargerJournal(date: string): Promise<EntreeJournal[]> {
  const { data, error } = await supabase.from('journal').select(COLONNES).eq('date', date).order('cree_le')
  if (error) throw error
  return (data as unknown as LigneJournal[]).map(versEntree)
}

// Renvoie l'entrée créée, complète : l'écran l'affiche telle quelle.
export async function ajouterEntree(entree: NouvelleEntree): Promise<EntreeJournal> {
  // Sans types générés pour la base, supabase-js ne sait pas lire une union
  // (il retient sa 1re forme). On élargit le type ici ; la règle « aliment OU
  // recette » est garantie par TypeScript (NouvelleEntree) ET par la base (check).
  const ligne: Record<string, unknown> = { ...entree }
  const { data, error } = await supabase.from('journal').insert(ligne).select(COLONNES).single()
  if (error) throw error
  return versEntree(data as unknown as LigneJournal)
}

export async function modifierEntree(id: string, changements: ChangementsEntree): Promise<EntreeJournal> {
  const { data, error } = await supabase.from('journal').update(changements).eq('id', id).select(COLONNES).single()
  if (error) throw error
  return versEntree(data as unknown as LigneJournal)
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
