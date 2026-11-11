import { useState } from 'react'
import { Link } from 'react-router'
import type { Recette } from '../types/recette'
import type { Repas } from '../types/journal'
import { ajouterEntree } from '../data/journal'
import { useOngletNutrition } from '../hooks/useOngletNutrition'
import { useValeurRecette } from '../hooks/useValeurRecette'
import { dateLocale } from '../utils/dates'
import DialogueRecetteJournal from './DialogueRecetteJournal'
import ValeurNutritive from './ValeurNutritive'

// Partie « nutrition » de la page de recette (membres connectés seulement) :
// la valeur nutritive par portion, et « J'en ai mangé » pour ceux qui ont
// activé le module Nutrition. Le calcul est fait UNE fois et partagé.
export default function SectionNutritionRecette({ recette }: { recette: Recette }) {
  const { valeur, erreur } = useValeurRecette(recette)
  const moduleActif = useOngletNutrition()
  const [ouvert, setOuvert] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [erreurAjout, setErreurAjout] = useState<string | null>(null)

  // Toujours dans le journal d'AUJOURD'HUI (jour local du Québec).
  async function enregistrer(choix: { portions: number; repas: Repas; quantite_texte: string }): Promise<boolean> {
    try {
      await ajouterEntree({ date: dateLocale(), recette_id: recette.id, ...choix })
      setConfirmation(`Ajouté au journal d'aujourd'hui (${choix.quantite_texte}).`)
      setErreurAjout(null)
      return true
    } catch {
      setErreurAjout("La recette n'a pas été ajoutée au journal. Vérifie ta connexion.")
      return false
    }
  }

  return (
    <>
      <ValeurNutritive valeur={valeur} erreur={erreur} />
      {moduleActif && (
        <button
          type="button"
          className="bouton bouton-liste"
          onClick={() => {
            setConfirmation(null)
            setOuvert(true)
          }}
        >
          🍽️ J'en ai mangé
        </button>
      )}
      {confirmation && (
        <p className="confirmation" role="status">
          {confirmation} <Link to="/nutrition">Voir le journal</Link>
        </p>
      )}
      {erreurAjout && <p className="message-erreur">{erreurAjout}</p>}
      {ouvert && (
        <DialogueRecetteJournal
          titre={recette.titre}
          parPortion={valeur?.parPortion ?? null}
          onEnregistrer={enregistrer}
          onFerme={() => setOuvert(false)}
        />
      )}
    </>
  )
}
