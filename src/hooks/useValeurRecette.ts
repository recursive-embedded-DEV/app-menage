import { useEffect, useMemo, useState } from 'react'
import type { Aliment } from '../types/aliment'
import type { Recette } from '../types/recette'
import { chargerAlimentsFcen } from '../data/aliments'
import { valeurRecette } from '../utils/nutrition'

// Valeur nutritive d'une recette : charge les aliments de ses ingrédients
// (une requête), puis calcule le total et les valeurs par portion.
// Réservé aux membres connectés : la table aliments est protégée par RLS.
export function useValeurRecette(recette: Recette) {
  const [aliments, setAliments] = useState<Map<number, Aliment> | null>(null)
  const [erreur, setErreur] = useState(false)

  // Codes FCEN distincts des ingrédients (useMemo : même tableau d'un rendu à
  // l'autre, sinon l'effet ci-dessous se relancerait sans arrêt).
  const codes = useMemo(
    () => [...new Set(recette.ingredients.flatMap((g) => g.items).flatMap((i) => (i.fcen === undefined ? [] : [i.fcen])))],
    [recette],
  )

  useEffect(() => {
    chargerAlimentsFcen(codes)
      .then(setAliments)
      .catch(() => setErreur(true))
  }, [codes])

  return { valeur: aliments ? valeurRecette(recette, aliments) : null, erreur }
}
