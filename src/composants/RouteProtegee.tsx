import type { ReactNode } from 'react'
import { demarrerSynchroNutrition } from '../data/synchro-nutrition'
import { useConnexion } from '../hooks/useConnexion'
import PageConnexion from '../pages/PageConnexion'

// Au premier chargement de ce composant (première page protégée) : l'onglet
// Nutrition sera remis à jour à chaque connexion, sans passer par Mon profil.
demarrerSynchroNutrition()

// Enveloppe les routes réservées au ménage (les Listes).
// Les Recettes ne passent pas par ici : elles restent publiques.
//
// Ce garde ne fait que choisir quoi AFFICHER. La vraie sécurité est dans la
// base : sans connexion, les règles RLS ne renvoient aucune donnée, même si
// quelqu'un contournait ce composant.
export default function RouteProtegee({ children }: { children: ReactNode }) {
  const etat = useConnexion()

  if (etat === 'inconnu') return null // fraction de seconde au démarrage
  if (etat === 'deconnecte') return <PageConnexion />
  return children
}
