import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Livre } from '../types/liste'

interface Props {
  livre: Livre | null // null : ajout ; sinon : modification de ce livre
  categories: string[] // catégories existantes (suggestions)
  onEnregistrer: (livre: Omit<Livre, 'id'>) => void
  onSupprimer?: () => void // modification seulement
  onFerme: () => void
}

// Ajout OU modification d'un livre. Monté à l'ouverture, démonté à la
// fermeture (son état repart à zéro), comme les autres boîtes de l'app.
export default function DialogueLivre({ livre, categories, onEnregistrer, onSupprimer, onFerme }: Props) {
  // useRef : une « poignée » vers le vrai <dialog> du DOM, pour appeler
  // showModal() et close(), qui n'ont pas d'équivalent en React.
  const dialogue = useRef<HTMLDialogElement>(null)
  const [confirmer, setConfirmer] = useState(false)

  useEffect(() => {
    dialogue.current?.showModal()
  }, [])

  function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const donnees = new FormData(e.currentTarget)
    const lire = (nom: string) => String(donnees.get(nom) ?? '').trim()

    onEnregistrer({
      titre: lire('titre'),
      auteur: lire('auteur'),
      lien: lire('lien'),
      isbn: lire('isbn').replace(/\D/g, ''),
      image: livre?.image ?? '', // image locale conservée ; sinon Open Library
      categorie: lire('categorie'),
    })
    dialogue.current?.close()
  }

  return (
    <dialog className="dialogue" ref={dialogue} onClose={onFerme}>
      <form className="formulaire" onSubmit={soumettre}>
        <h2>{livre ? 'Modifier le livre' : 'Nouveau livre'}</h2>
        <label>
          Titre <input type="text" name="titre" required defaultValue={livre?.titre} />
        </label>
        <label>
          Auteur <input type="text" name="auteur" required defaultValue={livre?.auteur} />
        </label>
        <label>
          Catégorie <small>(facultatif)</small>
          {/* list + <datalist> : le navigateur propose les catégories existantes,
              mais on peut aussi en taper une nouvelle. */}
          <input type="text" name="categorie" list="categories-livres" defaultValue={livre?.categorie} placeholder="Leadership, Finances…" />
          <datalist id="categories-livres">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Lien Amazon <input type="url" name="lien" defaultValue={livre?.lien} />
        </label>
        <label>
          ISBN <input type="text" name="isbn" inputMode="numeric" defaultValue={livre?.isbn} />
        </label>

        <div className="dialogue-actions">
          <button type="button" className="bouton" onClick={() => dialogue.current?.close()}>
            Annuler
          </button>
          <button type="submit" className="bouton">
            {livre ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>

        {/* Suppression : confirmation intégrée (un livre se perd moins vite qu'un article). */}
        {onSupprimer && !confirmer && (
          <button type="button" className="bouton-discret" onClick={() => setConfirmer(true)}>
            Supprimer ce livre
          </button>
        )}
        {onSupprimer && confirmer && (
          <div className="confirmation-suppression" role="alertdialog" aria-label="Confirmer la suppression">
            <p>Supprimer « {livre?.titre} » ?</p>
            <div className="dialogue-actions">
              <button type="button" className="bouton" onClick={() => setConfirmer(false)}>
                Non
              </button>
              <button
                type="button"
                className="bouton bouton-danger"
                onClick={() => {
                  onSupprimer()
                  dialogue.current?.close()
                }}
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        )}
      </form>
    </dialog>
  )
}
