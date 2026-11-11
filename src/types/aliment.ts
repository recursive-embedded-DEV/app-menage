// Types du module Nutrition.

// Les 4 valeurs suivies. Pour un aliment : valeurs POUR 100 G.
export interface Valeurs {
  kcal: number
  proteines_g: number
  glucides_g: number
  lipides_g: number
}

// Mesure de cuisine et son poids : { nom: "1 oeuf moyen", g: 45.6 }
export interface Mesure {
  nom: string
  g: number
}

export interface Aliment extends Valeurs {
  id: number
  source: 'fcen' | 'perso' // FCEN de Santé Canada, ou créé par un membre
  nom: string
  groupe: string
  mesures: Mesure[]
  // Légume « libre » : ne compte ni dans les calories ni dans les macros
  // (journal et recettes). Calculé par supabase/nutrition-c.sql pour le FCEN,
  // choisi par le membre pour un aliment perso.
  legume_libre: boolean
  auteur_id: string | null // membre qui a créé l'aliment perso ; null pour le FCEN
}

// Ce qu'on fournit pour créer un aliment perso (la base complète le reste).
export type NouvelAliment = Omit<Aliment, 'id' | 'source' | 'groupe' | 'auteur_id'>
