import type { Recette } from '../types/recette'
import { estImageEnLigne } from './images'

// 25 → "25 min" · 60 → "1 h" · 255 → "4 h 15" · 725 → "12 h 05"
export function formaterDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  const reste = minutes % 60
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`
}

// Donnée dérivée : calculée, jamais stockée dans la base.
// Pick : seul le champ temps est nécessaire (sert aussi au résumé de la liste).
export function tempsTotal(recette: Pick<Recette, 'temps'>): number {
  const t = recette.temps
  return t.preparation_min + t.cuisson_min + t.repos_min
}

// Adresse d'une image de recette. Une photo ajoutée dans l'app est déjà une
// adresse complète (Supabase Storage). Sinon, c'est un fichier de public/img/ :
// BASE_URL vaut "/" en développement et "/app-menage/" sur GitHub Pages.
export function cheminImage(fichier: string): string {
  if (estImageEnLigne(fichier)) return fichier
  return `${import.meta.env.BASE_URL}img/${fichier}`
}
