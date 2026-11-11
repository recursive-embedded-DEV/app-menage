import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Valeurs } from '../types/aliment'
import type { ChangementsEntree, EntreeJournal, NouvelleEntree } from '../types/journal'
import { chargerAlimentsFcen } from '../data/aliments'
import { trouverRecette } from '../data/donnees'
import { ajouterEntree, chargerJournal, modifierEntree, supprimerEntree } from '../data/journal'
import { valeurRecette } from '../utils/nutrition'

// Journal d'UNE journée. La page le recrée (key={date}) quand on change de
// jour : l'état repart à zéro, avec « Chargement… », sans logique de remise à zéro.
// Pas de temps réel : le journal est privé, un seul membre le modifie.
export function useJournal(date: string) {
  const [entrees, setEntrees] = useState<EntreeJournal[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  // Valeurs d'UNE portion de chaque recette consommée ce jour-là (par id).
  const [parPortion, setParPortion] = useState<Map<string, Valeurs>>(new Map())

  const recharger = useCallback(() => {
    chargerJournal(date)
      .then((resultat) => {
        setEntrees(resultat)
        setErreur(null)
      })
      .catch(() => setErreur('Impossible de charger le journal. Vérifie ta connexion.'))
      .finally(() => setChargement(false))
  }, [date])

  useEffect(() => {
    recharger()
  }, [recharger])

  // Ids des recettes du jour, sous forme de texte stable (« banh-mi,potage ») :
  // l'effet suivant ne se relance que si cette liste change vraiment.
  const idsRecettes = useMemo(
    () => [...new Set(entrees.flatMap((e) => (e.type === 'recette' ? [e.recette_id] : [])))].sort().join(','),
    [entrees],
  )

  // Valeurs des recettes : tous leurs ingrédients en UNE requête d'aliments,
  // puis valeurRecette (légumes libres exclus) pour chacune.
  useEffect(() => {
    const recettes = idsRecettes
      .split(',')
      .filter(Boolean)
      .flatMap((id) => {
        const r = trouverRecette(id)
        return r ? [r] : []
      })
    if (recettes.length === 0) return
    const codes = [
      ...new Set(recettes.flatMap((r) => r.ingredients.flatMap((g) => g.items.flatMap((i) => (i.fcen === undefined ? [] : [i.fcen]))))),
    ]
    chargerAlimentsFcen(codes)
      .then((aliments) => setParPortion(new Map(recettes.map((r) => [r.id, valeurRecette(r, aliments).parPortion]))))
      .catch(() => setErreur('Impossible de calculer les recettes du jour. Vérifie ta connexion.'))
  }, [idsRecettes])

  // Ajout et modification : on attend la réponse de Supabase, qui renvoie
  // l'entrée complète. Renvoient true en cas de succès (la boîte se ferme).
  async function ajouter(nouvelle: NouvelleEntree): Promise<boolean> {
    try {
      const creee = await ajouterEntree(nouvelle)
      setEntrees((actuelles) => [...actuelles, creee])
      return true
    } catch {
      setErreur("L'aliment n'a pas été ajouté. Vérifie ta connexion.")
      return false
    }
  }

  async function modifier(id: string, changements: ChangementsEntree): Promise<boolean> {
    try {
      const modifiee = await modifierEntree(id, changements)
      setEntrees((actuelles) => actuelles.map((e) => (e.id === id ? modifiee : e)))
      return true
    } catch {
      setErreur("La modification n'a pas été enregistrée. Vérifie ta connexion.")
      return false
    }
  }

  // Suppression OPTIMISTE (comme les listes) : l'entrée disparaît tout de
  // suite ; si Supabase refuse, on recharge l'état réel.
  function supprimer(id: string) {
    setEntrees((actuelles) => actuelles.filter((e) => e.id !== id))
    supprimerEntree(id).catch(() => {
      setErreur("La suppression n'a pas été enregistrée. Vérifie ta connexion.")
      recharger()
    })
  }

  return { entrees, parPortion, chargement, erreur, ajouter, modifier, supprimer }
}
