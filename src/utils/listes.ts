import type { Livre } from '../types/liste'

// Logique PURE des listes de livres (testée dans listes.test.ts).

export const SANS_CATEGORIE = 'Autres'

// Comparaison en français : « Économie » se range avec les « E », sans tenir
// compte des majuscules ni des accents.
const comparer = new Intl.Collator('fr-CA', { sensitivity: 'base' }).compare

// Livres regroupés par catégorie : catégories par ordre alphabétique, livres
// sans catégorie à la fin (« Autres »). Dans un groupe, l'ordre d'ajout est gardé.
export function grouperLivres(livres: Livre[]): { categorie: string; livres: Livre[] }[] {
  const parCategorie = new Map<string, Livre[]>()
  for (const livre of livres) {
    const cle = livre.categorie.trim()
    parCategorie.set(cle, [...(parCategorie.get(cle) ?? []), livre])
  }
  return [...parCategorie.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : comparer(a, b)))
    .map(([categorie, groupe]) => ({ categorie: categorie || SANS_CATEGORIE, livres: groupe }))
}

// Catégories déjà utilisées (suggestions du champ Catégorie), sans doublons.
// « leadership » et « Leadership » comptent pour une seule (la 1re écriture gagne).
export function categoriesDe(livres: Livre[]): string[] {
  const vues = new Map<string, string>()
  for (const { categorie } of livres) {
    const propre = categorie.trim()
    const cle = propre.toLocaleLowerCase('fr-CA')
    if (propre && !vues.has(cle)) vues.set(cle, propre)
  }
  return [...vues.values()].sort(comparer)
}
