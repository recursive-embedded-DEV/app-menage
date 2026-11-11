import type { ValeurRecette } from '../utils/nutrition'
import { CLES_VALEURS, formaterValeur } from '../utils/nutrition'

const LIBELLES = { kcal: 'Calories', proteines_g: 'Protéines', glucides_g: 'Glucides', lipides_g: 'Lipides' }

interface Props {
  valeur: ValeurRecette
}

// « Valeur nutritive par portion » (affichage seulement ; le calcul est fait
// par valeurRecette dans SectionNutritionRecette).
// Par portion de la recette de base : elle ne dépend pas du nombre de portions
// choisi dans le sélecteur.
export default function ValeurNutritive({ valeur }: Props) {
  return (
    <section className="valeur-nutritive">
      <h2>Valeur nutritive par portion</h2>
      <dl>
        {CLES_VALEURS.map((cle) => (
          <div key={cle}>
            <dt>{LIBELLES[cle]}</dt>
            <dd>
              {formaterValeur(valeur.parPortion[cle], cle)} {cle === 'kcal' ? 'kcal' : 'g'}
            </dd>
          </div>
        ))}
      </dl>
      {valeur.legumes.length > 0 && (
        <p className="note-portions">Légumes non comptés : {valeur.legumes.join(', ')}.</p>
      )}
      {valeur.exclus.length > 0 && (
        <p className="note-portions">Non comptés (sans quantité ou absents de la base) : {valeur.exclus.join(', ')}.</p>
      )}
      <p className="attribution">
        Source : Fichier canadien sur les éléments nutritifs, Santé Canada, 2026. Valeurs approximatives.
      </p>
    </section>
  )
}
