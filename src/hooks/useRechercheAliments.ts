import { useEffect, useState } from 'react'
import type { Aliment } from '../types/aliment'
import { rechercherAliments } from '../data/aliments'

// Délai sans frappe avant de lancer la recherche : on n'envoie pas une requête
// par lettre tapée (« debounce »).
const DELAI_MS = 250
const LONGUEUR_MIN = 2

// Recherche d'aliments au fil de la frappe.
// `version` : à augmenter pour relancer la même recherche (après avoir
// modifié ou supprimé un aliment, la liste affichée serait périmée).
export function useRechercheAliments(texte: string, version = 0) {
  const [resultats, setResultats] = useState<Aliment[]>([])
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const propre = texte.trim()
  const assezLong = propre.length >= LONGUEUR_MIN

  useEffect(() => {
    if (!assezLong) return

    // « annule » protège contre une réponse tardive : si l'utilisateur a tapé
    // « riz » puis « rizotto », la réponse de « riz » arrivée en retard ne doit
    // pas remplacer celle de « rizotto ».
    let annule = false
    const minuterie = window.setTimeout(() => {
      setEnCours(true)
      rechercherAliments(propre)
        .then((r) => {
          if (annule) return
          setResultats(r)
          setErreur(null)
        })
        .catch(() => {
          if (!annule) setErreur('Recherche impossible. Vérifie ta connexion.')
        })
        .finally(() => {
          if (!annule) setEnCours(false)
        })
    }, DELAI_MS)

    return () => {
      annule = true
      window.clearTimeout(minuterie)
    }
    // version est dans les dépendances : la changer relance l'effet.
  }, [propre, assezLong, version])

  // Moins de 2 lettres : aucun résultat (calculé, pas d'état à remettre à zéro).
  return { resultats: assezLong ? resultats : [], enCours: assezLong && enCours, erreur }
}
