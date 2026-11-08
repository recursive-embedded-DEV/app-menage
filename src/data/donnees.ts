import type { Recette } from '../types/recette'
import donneesJson from './recettes.json'

// Point d'accès unique aux recettes. Quand on passera à Supabase,
// seul ce fichier changera : les composants n'y verront que du feu.
export const recettes: Recette[] = donneesJson

export function trouverRecette(id: string): Recette | undefined {
  return recettes.find((r) => r.id === id)
}
