import type { Aliment, Valeurs } from './aliment'
import type { IngredientNutrition } from '../utils/nutrition'

export type Repas = 'dejeuner' | 'diner' | 'souper' | 'collation'

// Une ligne du journal : SOIT un aliment, SOIT une recette (union discriminée,
// comme Liste). Le champ `type` dit laquelle ; la base garantit la même règle.
interface EntreeCommune {
  id: string
  date: string // AAAA-MM-JJ, jour local du Québec
  repas: Repas
  quantite_texte: string // ce qui a été choisi : « 2 × 1 oeuf moyen », « 1,5 portion »
}

export interface EntreeAliment extends EntreeCommune {
  type: 'aliment'
  grammes: number // la vérité pour les calculs
  aliment: Aliment
}

export interface EntreeRecette extends EntreeCommune {
  type: 'recette'
  recette_id: string // id dans la table recettes
  portions: number
  // La recette, jointe par Supabase (clé étrangère journal.recette_id) avec ses
  // ingrédients et leurs aliments : tout ce qu'il faut pour calculer ses valeurs.
  recette: { titre: string; portions: number; ingredients: IngredientNutrition[] } | null
}

export type EntreeJournal = EntreeAliment | EntreeRecette

interface NouvelleCommune {
  date: string
  repas: Repas
  quantite_texte: string
}

export type NouvelleEntree =
  | (NouvelleCommune & { aliment_id: number; grammes: number })
  | (NouvelleCommune & { recette_id: string; portions: number })

// Ce qu'on peut changer sur une entrée existante (grammes OU portions).
export interface ChangementsEntree {
  repas: Repas
  quantite_texte: string
  grammes?: number
  portions?: number
}

// Objectifs du jour ; null tant qu'un objectif n'est pas défini.
export type Objectifs = Record<keyof Valeurs, number | null>

export interface ProfilNutrition {
  actif: boolean // onglet Nutrition affiché ?
  objectifs: Objectifs
}
