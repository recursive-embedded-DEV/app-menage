import { useCallback, useEffect, useState } from 'react'
import type { ChangementsEntree, EntreeJournal, NouvelleEntree } from '../types/journal'
import { ajouterEntree, chargerJournal, modifierEntree, supprimerEntree } from '../data/journal'

// Journal d'UNE journée. La page le recrée (key={date}) quand on change de
// jour : l'état repart à zéro, avec « Chargement… », sans logique de remise à zéro.
// Pas de temps réel : le journal est privé, un seul membre le modifie.
export function useJournal(date: string) {
  const [entrees, setEntrees] = useState<EntreeJournal[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

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

  // Ajout et modification : on attend la réponse de Supabase, qui renvoie
  // l'entrée complète (avec son aliment). Renvoient true en cas de succès,
  // pour que la boîte de dialogue se ferme.
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

  return { entrees, chargement, erreur, ajouter, modifier, supprimer }
}
