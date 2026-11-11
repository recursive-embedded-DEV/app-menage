import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import type { Recette } from '../types/recette'
import { useAjoutEpicerie } from '../hooks/useAjoutEpicerie'
import { ajusterQuantite, aUneQuantite, texteArticle } from '../utils/portions'
import SelecteurPortions from './SelecteurPortions'

interface Props {
  recette: Recette
  portionsPage: number // valeur choisie sur la page de recette, reprise à l'ouverture
}

// Le bouton « Ajouter à l'épicerie » et sa boîte de dialogue :
// nombre de portions + ingrédients à cocher, puis un seul envoi à Supabase.
export default function DialogueEpicerie({ recette, portionsPage }: Props) {
  // useRef : poignée vers le vrai <dialog>, pour showModal() et close().
  const dialogue = useRef<HTMLDialogElement>(null)
  const [portions, setPortions] = useState(portionsPage)
  // Clés des ingrédients cochés. Un Set : « est-il coché ? » se vérifie directement.
  const [coches, setCoches] = useState<Set<string>>(new Set())
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const { ajouter, enCours, erreur } = useAjoutEpicerie()

  const facteur = portions / recette.portions
  // Clé stable d'un ingrédient : position du groupe et position dans le groupe.
  const cle = (i: number, j: number) => `${i}-${j}`

  function ouvrir() {
    setPortions(portionsPage)
    // Pré-cochés : seulement les ingrédients avec une quantité chiffrée.
    // « Sel et poivre — Au goût » est souvent déjà à la maison.
    const avecQuantite = recette.ingredients.flatMap((groupe, i) =>
      groupe.items.flatMap((ing, j) => (aUneQuantite(ing.quantite) ? [cle(i, j)] : [])),
    )
    setCoches(new Set(avecQuantite))
    setConfirmation(null)
    dialogue.current?.showModal()
  }

  function basculer(c: string) {
    // Jamais modifier l'état en place : on copie le Set, puis on le change.
    setCoches((actuels) => {
      const nouveaux = new Set(actuels)
      if (nouveaux.has(c)) nouveaux.delete(c)
      else nouveaux.add(c)
      return nouveaux
    })
  }

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const textes = recette.ingredients.flatMap((groupe, i) =>
      groupe.items.flatMap((ing, j) =>
        coches.has(cle(i, j)) ? [texteArticle(ing.nom, ing.quantite, facteur)] : [],
      ),
    )
    if (await ajouter(textes)) {
      dialogue.current?.close()
      setConfirmation(
        textes.length === 1 ? '1 ingrédient ajouté à l\'épicerie.' : `${textes.length} ingrédients ajoutés à l'épicerie.`,
      )
    }
  }

  return (
    <>
      <button type="button" className="bouton bouton-liste" onClick={ouvrir}>
        🛒 Ajouter les ingrédients à la liste d'épicerie
      </button>
      {confirmation && (
        <p className="confirmation" role="status">
          {confirmation} <Link to="/listes/epicerie">Voir la liste</Link>
        </p>
      )}

      <dialog id="dialogue-epicerie" ref={dialogue}>
        <form onSubmit={soumettre}>
          <h2>Ajouter à l'épicerie</h2>
          <SelecteurPortions valeur={portions} onChange={setPortions} />

          {recette.ingredients.map((groupe, i) => (
            <fieldset key={i}>
              {groupe.section && <legend>{groupe.section}</legend>}
              {groupe.items.map((ing, j) => (
                <label key={j}>
                  <input type="checkbox" checked={coches.has(cle(i, j))} onChange={() => basculer(cle(i, j))} />
                  <span>
                    {ing.nom} <small>{ajusterQuantite(ing.quantite, facteur)}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          ))}

          {erreur && <p className="message-erreur">{erreur}</p>}
          <div className="dialogue-actions">
            <button type="button" className="bouton" onClick={() => dialogue.current?.close()}>
              Annuler
            </button>
            <button type="submit" className="bouton" disabled={enCours || coches.size === 0}>
              {enCours ? 'Ajout…' : `Ajouter (${coches.size})`}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
