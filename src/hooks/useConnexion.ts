import { useEffect, useState } from 'react'
import { ecouterConnexion } from '../data/auth'

// 'inconnu' : au tout premier affichage, on ne sait pas encore si une session
// est enregistrée sur l'appareil. On attend la réponse de Supabase plutôt que
// d'afficher brièvement la page de connexion à quelqu'un de déjà connecté.
export type EtatConnexion = 'inconnu' | 'connecte' | 'deconnecte'

export function useConnexion(): EtatConnexion {
  const [etat, setEtat] = useState<EtatConnexion>('inconnu')

  // ecouterConnexion retourne sa fonction de nettoyage : on la renvoie
  // directement à React, qui l'appellera au démontage.
  useEffect(() => ecouterConnexion((connecte) => setEtat(connecte ? 'connecte' : 'deconnecte')), [])

  return etat
}
