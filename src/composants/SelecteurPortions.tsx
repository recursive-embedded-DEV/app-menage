interface Props {
  valeur: number
  onChange: (portions: number) => void
}

const MINIMUM = 1
const MAXIMUM = 99

// [−] 4 portions [+]
// Composant « contrôlé » : il n'a pas d'état à lui. Le parent détient la valeur
// et la reçoit à chaque clic. Il sert sur la page de recette ET dans la boîte
// de dialogue d'ajout à l'épicerie.
export default function SelecteurPortions({ valeur, onChange }: Props) {
  return (
    <div className="selecteur-portions" role="group" aria-label="Nombre de portions">
      <button
        type="button"
        className="bouton"
        aria-label="Une portion de moins"
        disabled={valeur <= MINIMUM}
        onClick={() => onChange(valeur - 1)}
      >
        −
      </button>
      {/* aria-live : un lecteur d'écran annonce la nouvelle valeur. */}
      <span aria-live="polite">
        {valeur} {valeur >= 2 ? 'portions' : 'portion'}
      </span>
      <button
        type="button"
        className="bouton"
        aria-label="Une portion de plus"
        disabled={valeur >= MAXIMUM}
        onClick={() => onChange(valeur + 1)}
      >
        +
      </button>
    </div>
  )
}
