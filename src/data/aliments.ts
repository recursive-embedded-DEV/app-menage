import type { Aliment, NouvelAliment } from '../types/aliment'
import { supabase } from './supabase'

// Le SEUL fichier qui sait où sont les aliments : la table public.aliments
// de Supabase (FCEN de Santé Canada + aliments perso du ménage).

// Colonnes utiles à l'app (la table a aussi code_fcen, auteur_id, nom_normalise…).
// Exportées : le journal les réutilise pour joindre l'aliment de chaque entrée.
export const COLONNES_ALIMENT =
  'id, source, nom, groupe, kcal, proteines_g, glucides_g, lipides_g, mesures, legume_libre, auteur_id'

// Erreur précise : l'aliment est utilisé dans un journal (ou une recette).
// La base refuse la suppression (clé étrangère « on delete restrict »).
export class AlimentUtilise extends Error {}

// Aliments du FCEN par leurs codes (ingrédients d'une recette), en UNE requête.
// Renvoie une table code FCEN → aliment.
export async function chargerAlimentsFcen(codes: number[]): Promise<Map<number, Aliment>> {
  if (codes.length === 0) return new Map()
  const { data, error } = await supabase
    .from('aliments')
    .select(`${COLONNES_ALIMENT}, code_fcen`)
    .in('code_fcen', codes)
  if (error) throw error
  const lignes = data as (Aliment & { code_fcen: number })[]
  return new Map(lignes.map(({ code_fcen, ...aliment }) => [code_fcen, aliment]))
}

// Appelle la fonction SQL rechercher_aliments (supabase/nutrition.sql) :
// mots dans n'importe quel ordre, sans tenir compte des accents, 20 résultats.
export async function rechercherAliments(texte: string): Promise<Aliment[]> {
  const { data, error } = await supabase.rpc('rechercher_aliments', { texte }).select(COLONNES_ALIMENT)
  if (error) throw error
  return data as Aliment[]
}

// Crée un aliment perso. La base complète source ('perso') et auteur_id
// (compte connecté) ; les règles RLS refusent toute autre combinaison.
export async function creerAliment(aliment: NouvelAliment): Promise<Aliment> {
  const { data, error } = await supabase.from('aliments').insert(aliment).select(COLONNES_ALIMENT).single()
  if (error) throw error
  return data as Aliment
}

// Modifie un aliment perso. Les règles RLS n'autorisent que son auteur :
// pour un autre membre, aucune ligne n'est touchée et .single() lance une erreur.
export async function modifierAliment(id: number, aliment: NouvelAliment): Promise<Aliment> {
  const { data, error } = await supabase.from('aliments').update(aliment).eq('id', id).select(COLONNES_ALIMENT).single()
  if (error) throw error
  return data as Aliment
}

export async function supprimerAliment(id: number): Promise<void> {
  // .select('id') : renvoie les lignes réellement supprimées. Si RLS refuse,
  // Supabase ne signale AUCUNE erreur, mais rien n'est supprimé : on le vérifie.
  const { data, error } = await supabase.from('aliments').delete().eq('id', id).select('id')
  // 23503 : code PostgreSQL d'une violation de clé étrangère (aliment utilisé).
  if (error?.code === '23503') throw new AlimentUtilise()
  if (error) throw error
  if (!data || data.length === 0) throw new Error("Cet aliment n'a pas pu être supprimé.")
}
