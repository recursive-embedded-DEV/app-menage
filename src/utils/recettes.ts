import type { Groupe } from '../types/recette'

// Dans la base, les ingrédients sont des LIGNES ordonnées (position), chacune
// avec sa section. L'affichage veut des GROUPES : { section, items }.
// Les lignes consécutives de même section forment un groupe.
//   [A:"", B:"", C:"Pour la vinaigrette"] → [{ "", [A, B] }, { "Pour la vinaigrette", [C] }]
// Les lignes sont gardées telles quelles dans items (section et position
// comprises) : ces champs en trop ne gênent aucun composant.
export function grouperParSection<T extends { section: string; position: number }>(lignes: T[]): Groupe<T>[] {
  const groupes: Groupe<T>[] = []
  // Tri par position : on ne dépend pas de l'ordre renvoyé par la base.
  for (const ligne of [...lignes].sort((a, b) => a.position - b.position)) {
    const dernier = groupes.at(-1)
    if (dernier && dernier.section === ligne.section) dernier.items.push(ligne)
    else groupes.push({ section: ligne.section, items: [ligne] })
  }
  return groupes
}
