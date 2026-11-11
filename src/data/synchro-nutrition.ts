import { memoriserOngletNutrition } from './cache-nutrition'
import { chargerProfil } from './profil'
import { supabase } from './supabase'

// Remplit le cache de l'onglet Nutrition (lu par NavBar) dès qu'un membre est
// connecté : après une connexion, ou à l'ouverture de l'app avec une session
// déjà enregistrée (nouvel appareil, cache effacé par une déconnexion…).
// Une seule lecture du profil par session ; la déconnexion réarme le tout.

let demarre = false
let synchronise = false

export function demarrerSynchroNutrition(): void {
  if (demarre) return // un seul abonnement, même si on l'appelle plusieurs fois
  demarre = true

  // Supabase envoie aussi l'état actuel (INITIAL_SESSION) dès l'abonnement.
  supabase.auth.onAuthStateChange((evenement, session) => {
    if (evenement === 'SIGNED_OUT' || !session) {
      synchronise = false
      return
    }
    if (synchronise) return
    synchronise = true

    // supabase-js recommande de ne pas appeler Supabase DIRECTEMENT dans ce
    // rappel (risque de blocage) : on diffère au tour suivant de la boucle.
    window.setTimeout(() => {
      chargerProfil()
        .then((profil) => memoriserOngletNutrition(profil.actif))
        .catch(() => {
          synchronise = false // on réessaiera au prochain événement
        })
    }, 0)
  })
}
