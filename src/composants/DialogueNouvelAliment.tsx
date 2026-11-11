import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Aliment } from '../types/aliment'
import { creerAliment } from '../data/aliments'
import { lireNombreSaisi, versPour100 } from '../utils/nutrition'

interface Props {
  onCree: (aliment: Aliment) => void
}

// Création d'un aliment perso à partir d'un tableau de valeurs nutritives
// (ex. Macaroni Protéine+ Catelli : « par 85 g : 300 Cal, 13 g de protéines… »).
// On saisit les valeurs PAR PORTION, comme sur l'emballage ; l'app les convertit
// pour 100 g avant de les enregistrer.
export default function DialogueNouvelAliment({ onCree }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const donnees = new FormData(e.currentTarget)
    const texte = (nom: string) => String(donnees.get(nom) ?? '').trim()
    const nombre = (nom: string) => lireNombreSaisi(texte(nom))

    const portion = nombre('portion')
    const parPortion = {
      kcal: nombre('kcal'),
      proteines_g: nombre('proteines'),
      glucides_g: nombre('glucides'),
      lipides_g: nombre('lipides'),
    }
    if (!(portion > 0) || Object.values(parPortion).some((n) => Number.isNaN(n) || n < 0)) {
      setErreur('Vérifie les nombres : la portion doit dépasser 0 g et les valeurs ne peuvent être négatives.')
      return
    }

    // Mesure facultative (« 1 tasse », 140 g) : seulement si les deux champs sont remplis.
    const nomMesure = texte('mesure_nom')
    const poidsMesure = nombre('mesure_g')
    const mesures = nomMesure && poidsMesure > 0 ? [{ nom: nomMesure, g: poidsMesure }] : []

    setEnCours(true)
    setErreur(null)
    try {
      const aliment = await creerAliment({ nom: texte('nom'), ...versPour100(parPortion, portion), mesures })
      dialogue.current?.close()
      onCree(aliment)
    } catch {
      setErreur("L'aliment n'a pas été créé. Vérifie ta connexion.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <>
      <button type="button" className="bouton bouton-liste" onClick={() => dialogue.current?.showModal()}>
        + Nouvel aliment
      </button>

      <dialog
        className="dialogue"
        ref={dialogue}
        onClose={() => {
          form.current?.reset()
          setErreur(null)
        }}
      >
        <form ref={form} className="formulaire" onSubmit={soumettre}>
          <h2>Nouvel aliment</h2>
          <label>
            Nom
            <input type="text" name="nom" required placeholder="Macaroni Protéine+, Catelli" />
          </label>
          {/* inputMode="decimal" : clavier numérique avec virgule sur téléphone. */}
          <label>
            Valeurs pour une portion de (g)
            <input type="text" name="portion" inputMode="decimal" required defaultValue="100" />
          </label>
          <div className="grille-valeurs">
            <label>
              Calories
              <input type="text" name="kcal" inputMode="decimal" required />
            </label>
            <label>
              Protéines (g)
              <input type="text" name="proteines" inputMode="decimal" required />
            </label>
            <label>
              Glucides (g)
              <input type="text" name="glucides" inputMode="decimal" required />
            </label>
            <label>
              Lipides (g)
              <input type="text" name="lipides" inputMode="decimal" required />
            </label>
          </div>
          <fieldset>
            <legend>Mesure de cuisine (facultatif)</legend>
            <div className="grille-valeurs">
              <label>
                Nom
                <input type="text" name="mesure_nom" placeholder="1 tasse" />
              </label>
              <label>
                Poids (g)
                <input type="text" name="mesure_g" inputMode="decimal" />
              </label>
            </div>
          </fieldset>

          {erreur && <p className="message-erreur">{erreur}</p>}
          <div className="dialogue-actions">
            <button type="button" className="bouton" onClick={() => dialogue.current?.close()}>
              Annuler
            </button>
            <button type="submit" className="bouton" disabled={enCours}>
              {enCours ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
