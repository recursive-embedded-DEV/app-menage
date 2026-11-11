// Types du module Recettes.
// Ils décrivent la forme exacte des objets de src/data/recettes.json.
// Si le JSON s'écarte de cette forme, TypeScript le signale dans VS Code.

export interface Ingredient {
  nom: string;
  quantite: string; // texte libre : "450 g", "1/2 tasse", "Au goût"
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
