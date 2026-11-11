import { useEffect, useState } from 'react'
import type { ProfilNutrition } from '../types/journal'
import { memoriserOngletNutrition } from '../data/cache-nutrition'
import { chargerProfil, enregistrerProfil } from '../data/profil'

// Profil nutrition du membre connecté (onglet affiché ? objectifs ?).
// À chaque lecture ou enregistrement, il remet à jour le cache local que lit
// NavBar : sur un nouvel appareil, l'onglet apparaît dès la première visite.
export function useProfilNutrition() {
  const [profil, setProfil] = useState<ProfilNutrition | null>(null) // null = pas encore chargé
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    chargerProfil()
      .then((p) => {
        setProfil(p)
        memoriserOngletNutrition(p.actif)
      })
      .catch(() => setErreur('Impossible de charger ton profil. Vérifie ta connexion.'))
  }, [])

  // Lance une erreur si l'enregistrement échoue : l'écran décide quoi afficher.
  async function enregistrer(nouveau: ProfilNutrition): Promise<void> {
    await enregistrerProfil(nouveau)
    setProfil(nouveau)
    memoriserOngletNutrition(nouveau.actif)
  }

  return { profil, erreur, enregistrer }
}
