import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Valeurs } from '../types/aliment'
import type { Repas } from '../types/journal'
import { heureLocale } from '../utils/dates'
import { REPAS, repasParDefaut, resumeValeurs, textePortions } from '../utils/nutrition'
import SelecteurPortions from './SelecteurPortions'

interface Props {
  titre: string // nom de la recette
  parPortion: Valeurs | null // valeurs d'UNE portion (null : pas encore calculées)
  depart?: { portions: number; repas: Repas } // modification : valeurs actuelles
  onEnregistrer: (choix: { portions: number; repas: Repas; quantite_texte: string }) => Promise<boolean>
  onFerme: () => void
}

// « J'en ai mangé » : combien de portions, à quel repas, avec un aperçu.
// Sert à l'ajout (page de recette) et à la modification (journal).
// Monté à l'ouverture, démonté à la fermeture : son état repart à zéro.
export default function DialogueRecetteJournal({ titre, parPortion, depart, onEnregistrer, onFerme }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const [portions, setPortions] = useState(depart?.portions ?? 1)
  const [repas, setRepas] = useState<Repas>(depart?.repas ?? repasParDefaut(heureLocale()))
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    dialogue.current?.showModal()
  }, [])

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    const reussi = await onEnregistrer({ portions, repas, quantite_texte: textePortions(portions) })
    setEnCours(false)
    if (reussi) dialogue.current?.close() // onClose → onFerme → démontage
  }

  const apercu = parPortion && {
    kcal: parPortion.kcal * portions,
    proteines_g: parPortion.proteines_g * portions,
    glucides_g: parPortion.glucides_g * portions,
    lipides_g: parPortion.lipides_g * portions,
  }

  return (
    <dialog className="dialogue" ref={dialogue} onClose={onFerme}>
      <form className="formulaire" onSubmit={soumettre}>
        <h2>{depart ? 'Modifier' : "J'en ai mangé"}</h2>
        <p className="aliment-choisi">
          <strong>{titre}</strong>
        </p>
        <SelecteurPortions valeur={portions} onChange={setPortions} pas={0.5} />
        <label>
          Repas
          <select value={repas} onChange={(e) => setRepas(e.target.value as Repas)}>
            {REPAS.map((r) => (
              <option key={r.cle} value={r.cle}>
                {r.libelle}
              </option>
            ))}
          </select>
        </label>
        <p className="note-portions">{apercu ? resumeValeurs(apercu) : 'Calcul des valeurs…'}</p>
        <div className="dialogue-actions">
          <button type="button" className="bouton" onClick={() => dialogue.current?.close()}>
            Annuler
          </button>
          <button type="submit" className="bouton" disabled={enCours}>
            {enCours ? 'Envoi…' : depart ? 'Enregistrer' : 'Ajouter au journal'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
