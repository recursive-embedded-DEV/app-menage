import { useSyncExternalStore } from 'react'
import { abonnerOngletNutrition, ongletNutritionActif } from '../data/cache-nutrition'

// Vrai si le membre a activé le module Nutrition (cache local, sans réseau).
// useSyncExternalStore abonne le composant au cache : il se met à jour dès que
// la préférence change. Utilisé par NavBar et par la page de recette.
export function useOngletNutrition(): boolean {
  return useSyncExternalStore(abonnerOngletNutrition, ongletNutritionActif)
}
