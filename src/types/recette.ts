// Types du module Recettes.
// Les recettes sont dans Supabase (tables recettes et ingredients_recette) ;
// data/donnees.ts les convertit dans cette forme pour les composants.

import type { Aliment } from './aliment'

export interface Ingredient {
  nom: string;
  quantite: string; // texte libre : "450 g", "1/2 tasse", "Au goût"
  // Lien vers la base d'aliments (module Nutrition), pour la recette DE BASE :
  // l'aliment (FCEN ou perso) et son poids. null = exclu du calcul
  // (« Au goût », eau…). L'aliment n'est joint que pour un membre connecté
  // (la table aliments est protégée par RLS) ; sinon il vaut null.
  aliment: Aliment | null;
  aliment_id: number | null;
  grammes: number | null;
}

// Générique : le même moule sert pour les ingrédients et pour les étapes.
//   Groupe<Ingredient> → items est une liste d'ingrédients
//   Groupe<string>     → items est une liste de phrases
export interface Groupe<T> {
  section: string; // "" quand la recette n'a pas de sections
  items: T[];
}

export interface Recette {
  id: string;    // sert aussi dans l'adresse : #/recettes/macaroni-proteine
  titre: string;
  image: string; // nom du fichier dans public/img/ ; "" si aucune image
  temps: {
    // Durées en minutes. 0 = cette étape n'existe pas pour la recette.
    preparation_min: number;
    cuisson_min: number;
    repos_min: number;
  };
  rendement: string; // texte affiché tel quel : "8 à 10 tranches", "1 pain"
  portions: number;  // base du calcul des quantités (src/utils/portions.ts)
  ingredients: Groupe<Ingredient>[];
  etapes: Groupe<string>[];
  notes: string[];
}

// Ce qu'affiche la liste des recettes (sans ingrédients ni étapes : plus léger).
export type ResumeRecette = Pick<Recette, 'id' | 'titre' | 'image' | 'temps' | 'rendement'>;
