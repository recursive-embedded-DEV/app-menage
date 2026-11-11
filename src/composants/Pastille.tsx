import type { Valeurs } from '../types/aliment'
import { formaterValeur } from '../utils/nutrition'
import { TYPES_OBJECTIFS, etatPastille } from '../utils/pastilles'

const NOMS: Record<keyof Valeurs, { libelle: string; unite: string }> = {
  kcal: { libelle: 'Calories', unite: 'kcal' },
  proteines_g: { libelle: 'Protéines', unite: 'g' },
  glucides_g: { libelle: 'Glucides', unite: 'g' },
  lipides_g: { libelle: 'Lipides', unite: 'g' },
}

interface Props {
  cle: keyof Valeurs
  valeur: number // total du jour
  objectif: number | null // null : pas encore défini
}

// Avancement vers un objectif du jour. La couleur n'est JAMAIS la seule
// information : le pourcentage et les valeurs sont écrits (lisible par une
// personne daltonienne et par un lecteur d'écran).
export default function Pastille({ cle, valeur, objectif }: Props) {
  const { libelle, unite } = NOMS[cle]
  const texteValeur = formaterValeur(valeur, cle)

  if (objectif === null) {
    return (
      <div className="pastille pastille-sans-objectif">
        <span className="pastille-libelle">{libelle}</span>
        <strong>
          {texteValeur} {unite}
        </strong>
        <span className="pastille-valeur">Aucun objectif</span>
      </div>
    )
  }

  const type = TYPES_OBJECTIFS[cle]
  const { pourcentage, couleur } = etatPastille(valeur, objectif, type)

  return (
    <div className={`pastille pastille-${couleur}`}>
      <span className="pastille-libelle">
        <span className="pastille-point" aria-hidden="true" />
        {libelle} <small>{type === 'minimum' ? 'min.' : 'max.'}</small>
      </span>
      <strong>{pourcentage} %</strong>
      <span className="pastille-valeur">
        {texteValeur} / {formaterValeur(objectif, cle)} {unite}
      </span>
      {/* Barre d'avancement, plafonnée à 100 % de sa largeur. */}
      <span className="pastille-barre" aria-hidden="true">
        <span style={{ width: `${Math.min(pourcentage, 100)}%` }} />
      </span>
    </div>
  )
}
