import { textePortions } from '../utils/nutrition'

interface Props {
  valeur: number
  onChange: (portions: number) => void
  pas?: number // 1 par défaut ; 0,5 pour « J'en ai mangé » (1,5 portion)
}

const MAXIMUM = 99

// [−] 4 portions [+]
// Composant « contrôlé » : il n'a pas d'état à lui. Le parent détient la valeur
// et la reçoit à chaque clic. Il sert sur la page de recette, dans la boîte
// d'ajout à l'épicerie et dans « J'en ai mangé ».
export default function SelecteurPortions({ valeur, onChange, pas = 1 }: Props) {
  // Arrondi au centième : 0,1 + 0,2 ne donne pas exactement 0,3 en binaire.
  const changer = (delta: number) => onChange(Math.round((valeur + delta) * 100) / 100)

  return (
    <div className="selecteur-portions" role="group" aria-label="Nombre de portions">
      <button
        type="button"
        className="bouton"
        aria-label="Moins"
        disabled={valeur <= pas}
        onClick={() => changer(-pas)}
      >
        −
      </button>
      {/* aria-live : un lecteur d'écran annonce la nouvelle valeur. */}
      <span aria-live="polite">{textePortions(valeur)}</span>
      <button
        type="button"
        className="bouton"
        aria-label="Plus"
        disabled={valeur >= MAXIMUM}
        onClick={() => changer(pas)}
      >
        +
      </button>
    </div>
  )
}
