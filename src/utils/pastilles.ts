import type { Valeurs } from '../types/aliment'

// Couleur des pastilles du journal : avancement vers l'objectif du jour.
//
// Les objectifs n'ont pas tous le même sens :
//   - protéines : un MINIMUM à atteindre (dépasser n'est pas un problème) ;
//   - calories, glucides, lipides : un MAXIMUM à ne pas dépasser.
// Seuils décidés avec Mathieu (voir CLAUDE.md), appliqués au % arrondi.

export type TypeObjectif = 'minimum' | 'maximum'
export type Couleur = 'gris' | 'jaune' | 'vert' | 'orange' | 'rouge'

export const TYPES_OBJECTIFS: Record<keyof Valeurs, TypeObjectif> = {
  kcal: 'maximum',
  proteines_g: 'minimum',
  glucides_g: 'maximum',
  lipides_g: 'maximum',
}

export interface EtatPastille {
  pourcentage: number // arrondi à l'unité
  couleur: Couleur
}

export function etatPastille(valeur: number, objectif: number, type: TypeObjectif): EtatPastille {
  const pourcentage = Math.round((valeur / objectif) * 100)

  if (type === 'minimum') {
    // gris < 50 % → jaune 50 à 89 % → vert ≥ 90 %
    const couleur = pourcentage < 50 ? 'gris' : pourcentage < 90 ? 'jaune' : 'vert'
    return { pourcentage, couleur }
  }

  // Maximum : gris tant que rien n'est consommé, vert jusqu'à 100 %,
  // orange de 101 à 110 %, rouge au-delà.
  const couleur =
    pourcentage === 0 ? 'gris' : pourcentage <= 100 ? 'vert' : pourcentage <= 110 ? 'orange' : 'rouge'
  return { pourcentage, couleur }
}
