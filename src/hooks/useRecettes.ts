import { useEffect, useState } from 'react'
import type { Recette, ResumeRecette } from '../types/recette'
import { chargerRecette, chargerRecettes } from '../data/donnees'

// Liste des recettes (page Recettes).
export function useRecettes() {
  const [recettes, setRecettes] = useState<ResumeRecette[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    chargerRecettes()
      .then(setRecettes)
      .catch(() => setErreur(true))
      .finally(() => setChargement(false))
  }, [])

  return { recettes, chargement, erreur }
}

// Une recette complète (page d'une recette). La page est recréée pour chaque
// recette (key={id}) : l'état repart à zéro, sans logique de remise à zéro.
export function useRecette(id: string) {
  const [recette, setRecette] = useState<Recette | undefined>(undefined)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    chargerRecette(id)
      .then(setRecette)
      .catch(() => setErreur(true))
      .finally(() => setChargement(false))
  }, [id])

  return { recette, chargement, erreur }
}
