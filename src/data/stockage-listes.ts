import type { Liste } from '../types/liste'
import { listesInitiales } from './listes-initiales'

// Le SEUL fichier qui sait OÙ les listes sont enregistrées.
// Aujourd'hui : le localStorage du navigateur (propre à chaque appareil).
// Plus tard : Supabase. Seules ces deux fonctions changeront.

// Préfixe : GitHub Pages partage le même localStorage entre tous tes
// projets sur recursive-embedded-dev.github.io. Le « v1 » permettra de
// changer la structure plus tard sans lire de vieilles données incompatibles.
const CLE = 'app-mm:listes:v1'

export function chargerListes(): Liste[] {
  try {
    const texte = localStorage.getItem(CLE)
    // localStorage ne stocke que du texte : JSON.parse le retransforme en objets.
    return texte ? (JSON.parse(texte) as Liste[]) : listesInitiales
  } catch {
    // Données illisibles ou localStorage indisponible : on repart du contenu de départ.
    return listesInitiales
  }
}

export function enregistrerListes(listes: Liste[]): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(listes))
  } catch {
    // Stockage plein ou refusé (ex. navigation privée) : on ignore.
  }
}
