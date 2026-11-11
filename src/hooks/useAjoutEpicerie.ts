import { useState } from 'react'
import { insererArticles } from '../data/stockage-listes'

// La liste qui reçoit les ingrédients. C'est la seule liste d'articles pour
// l'instant ; choisir la liste de destination est au Backlog.
const LISTE_EPICERIE = 'epicerie'

// Ajout d'ingrédients à la liste d'épicerie, depuis une recette.
// Contrairement à useListes, ce hook ne charge pas les listes et n'écoute pas
// le temps réel : la page de recette n'en a pas besoin. C'est la page
// Épicerie (ou l'autre téléphone) qui recevra les articles par le temps réel.
export function useAjoutEpicerie() {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Renvoie true si l'ajout a réussi, pour que l'appelant ferme la boîte de dialogue.
  async function ajouter(textes: string[]): Promise<boolean> {
    setEnCours(true)
    setErreur(null)
    try {
      await insererArticles(
        LISTE_EPICERIE,
        textes.map((texte) => ({ id: crypto.randomUUID(), texte, coche: false })),
      )
      return true
    } catch {
      setErreur("Les ingrédients n'ont pas été ajoutés. Vérifie ta connexion.")
      return false
    } finally {
      setEnCours(false)
    }
  }

  return { ajouter, enCours, erreur }
}
