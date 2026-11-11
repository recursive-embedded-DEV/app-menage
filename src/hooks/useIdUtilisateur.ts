import { useEffect, useState } from 'react'
import { idUtilisateur } from '../data/auth'

// Identifiant du membre connecté (null pendant la lecture de la session).
// Sert à n'afficher « Modifier / Supprimer » que sur SES aliments perso.
export function useIdUtilisateur(): string | null {
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    idUtilisateur()
      .then(setId)
      .catch(() => setId(null))
  }, [])

  return id
}
