import type { Aliment, NouvelAliment } from '../types/aliment'
import { supabase } from './supabase'

// Le SEUL fichier qui sait où sont les aliments : la table public.aliments
// de Supabase (FCEN de Santé Canada + aliments perso du ménage).

// Colonnes utiles à l'app (la table a aussi code_fcen, auteur_id, nom_normalise…).
const COLONNES = 'id, source, nom, groupe, kcal, proteines_g, glucides_g, lipides_g, mesures'

// Appelle la fonction SQL rechercher_aliments (supabase/nutrition.sql) :
// mots dans n'importe quel ordre, sans tenir compte des accents, 20 résultats.
export async function rechercherAliments(texte: string): Promise<Aliment[]> {
  const { data, error } = await supabase.rpc('rechercher_aliments', { texte }).select(COLONNES)
  if (error) throw error
  return data as Aliment[]
}

// Crée un aliment perso. La base complète source ('perso') et auteur_id
// (compte connecté) ; les règles RLS refusent toute autre combinaison.
export async function creerAliment(aliment: NouvelAliment): Promise<Aliment> {
  const { data, error } = await supabase.from('aliments').insert(aliment).select(COLONNES).single()
  if (error) throw error
  return data as Aliment
}
