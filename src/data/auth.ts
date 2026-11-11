import { supabase } from './supabase'

// Le SEUL fichier qui sait comment on se connecte.
// Mode choisi : courriel + mot de passe, comptes créés à la main dans Supabase
// (inscriptions publiques désactivées). Pas de lien magique : il renverrait
// un jeton dans le # de l'adresse, déjà utilisé par HashRouter.

export async function connecter(courriel: string, motDePasse: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: courriel, password: motDePasse })
  if (error) throw error
}

export async function deconnecter(): Promise<void> {
  await supabase.auth.signOut()
}

// Prévient l'appelant chaque fois que l'état de connexion change.
// Supabase envoie aussi un premier événement dès l'abonnement (session déjà
// enregistrée ou non) : pas besoin d'une lecture séparée au démarrage.
// Retourne la fonction qui arrête l'écoute (à appeler au démontage).
export function ecouterConnexion(rappel: (connecte: boolean) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evenement, session) => {
    rappel(session !== null)
  })
  return () => data.subscription.unsubscribe()
}
