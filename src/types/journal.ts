import type { Aliment, Valeurs } from './aliment'

export type Repas = 'dejeuner' | 'diner' | 'souper' | 'collation'

// Une ligne du journal, avec son aliment (joint par Supabase).
export interface EntreeJournal {
  id: string
  date: string // AAAA-MM-JJ, jour local du Québec
  repas: Repas
  grammes: number // la vérité pour les calculs
  quantite_texte: string // ce qui a été choisi : « 2 × 1 oeuf moyen », « 150 g »
  aliment: Aliment
}

export interface NouvelleEntree {
  date: string
  repas: Repas
  aliment_id: number
  grammes: number
  quantite_texte: string
}

// Ce qu'on peut changer sur une entrée existante.
export type ChangementsEntree = Pick<NouvelleEntree, 'repas' | 'grammes' | 'quantite_texte'>

// Objectifs du jour ; null tant qu'un objectif n'est pas défini.
export type Objectifs = Record<keyof Valeurs, number | null>

export interface ProfilNutrition {
  actif: boolean // onglet Nutrition affiché ?
  objectifs: Objectifs
}
