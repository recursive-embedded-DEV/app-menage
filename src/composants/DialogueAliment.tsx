import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Aliment } from '../types/aliment'
import { creerAliment, modifierAliment } from '../data/aliments'
import { lireNombreSaisi, versPour100 } from '../utils/nutrition'

interface Props {
  aliment: Aliment | null // null : création ; sinon : modification de cet aliment perso
  onEnregistre: (aliment: Aliment) => void
  onFerme: () => void
}

// « 12.27 » → « 12,27 » pour préremplir un champ (virgule décimale).
const enTexte = (n: number) => String(n).replace('.', ',')
// Valeur de départ d'un champ : vide (undefined) en création.
const depart = (n: number | undefined) => (n === undefined ? undefined : enTexte(n))

// Création OU modification d'un aliment perso, à partir d'un tableau de valeurs
// nutritives (ex. Macaroni Protéine+ Catelli : « par 85 g : 300 Cal, 13 g de
// protéines… »). On saisit les valeurs PAR PORTION, comme sur l'emballage ;
// l'app les convertit pour 100 g. En modification, le formulaire part des
// valeurs enregistrées, donc d'une portion de 100 g.
// Monté à l'ouverture, démonté à la fermeture : son état repart à zéro.
export default function DialogueAliment({ aliment, onEnregistre, onFerme }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [mesure] = aliment?.mesures ?? []

  useEffect(() => {
    dialogue.current?.showModal()
  }, [])

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
    const champs = {
      nom: texte('nom'),
      ...versPour100(parPortion, portion),
      mesures: nomMesure && poidsMesure > 0 ? [{ nom: nomMesure, g: poidsMesure }] : [],
      // Case cochée : FormData contient « on » ; décochée : la clé est absente.
      legume_libre: donnees.get('legume_libre') === 'on',
    }

    setEnCours(true)
    setErreur(null)
    try {
      const enregistre = aliment ? await modifierAliment(aliment.id, champs) : await creerAliment(champs)
      onEnregistre(enregistre)
      dialogue.current?.close() // onClose → onFerme → démontage
    } catch {
      setErreur((aliment ? "L'aliment n'a pas été modifié." : "L'aliment n'a pas été créé.") + ' Vérifie ta connexion.')
      setEnCours(false)
    }
  }

  return (
    <dialog className="dialogue" ref={dialogue} onClose={onFerme}>
      <form className="formulaire" onSubmit={soumettre}>
        <h2>{aliment ? "Modifier l'aliment" : 'Nouvel aliment'}</h2>
        <label>
          Nom
          <input type="text" name="nom" required placeholder="Macaroni Protéine+, Catelli" defaultValue={aliment?.nom} />
        </label>
        {/* inputMode="decimal" : clavier numérique avec virgule sur téléphone. */}
        <label>
          Valeurs pour une portion de (g)
          <input type="text" name="portion" inputMode="decimal" required defaultValue="100" />
        </label>
        <div className="grille-valeurs">
          <label>
            Calories
            <input type="text" name="kcal" inputMode="decimal" required defaultValue={depart(aliment?.kcal)} />
          </label>
          <label>
            Protéines (g)
            <input
              type="text"
              name="proteines"
              inputMode="decimal"
              required
              defaultValue={depart(aliment?.proteines_g)}
            />
          </label>
          <label>
            Glucides (g)
            <input
              type="text"
              name="glucides"
              inputMode="decimal"
              required
              defaultValue={depart(aliment?.glucides_g)}
            />
          </label>
          <label>
            Lipides (g)
            <input
              type="text"
              name="lipides"
              inputMode="decimal"
              required
              defaultValue={depart(aliment?.lipides_g)}
            />
          </label>
        </div>
        <fieldset>
          <legend>Mesure de cuisine (facultatif)</legend>
          <div className="grille-valeurs">
            <label>
              Nom
              <input type="text" name="mesure_nom" placeholder="1 tasse" defaultValue={mesure?.nom} />
            </label>
            <label>
              Poids (g)
              <input type="text" name="mesure_g" inputMode="decimal" defaultValue={mesure && enTexte(mesure.g)} />
            </label>
          </div>
        </fieldset>
        {/* Règle du ménage : les légumes ne comptent pas, sauf féculents et légumes gras. */}
        <label className="interrupteur">
          <input type="checkbox" name="legume_libre" defaultChecked={aliment?.legume_libre} />
          <span>
            <strong>Légume non compté</strong>
            <small>Pas un féculent ni un aliment gras : exclu des calories et des macros.</small>
          </span>
        </label>

        {erreur && <p className="message-erreur">{erreur}</p>}
        <div className="dialogue-actions">
          <button type="button" className="bouton" onClick={() => dialogue.current?.close()}>
            Annuler
          </button>
          <button type="submit" className="bouton" disabled={enCours}>
            {enCours ? 'Envoi…' : aliment ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
