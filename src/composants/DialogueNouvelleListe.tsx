import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { TypeListe } from '../types/liste'

interface Props {
  // Renvoie l'identifiant de la liste créée (null en cas d'échec).
  onCreer: (titre: string, type: TypeListe, personnelle: boolean) => Promise<string | null>
  onCreee: (id: string) => void // ex. ouvrir la nouvelle liste
  onFerme: () => void
}

// Nouvelle liste : un nom, un type, et partagée ou personnelle.
// Montée à l'ouverture, démontée à la fermeture.
export default function DialogueNouvelleListe({ onCreer, onCreee, onFerme }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    dialogue.current?.showModal()
  }, [])

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const donnees = new FormData(e.currentTarget)
    const titre = String(donnees.get('titre') ?? '').trim()
    const type = donnees.get('type') === 'livres' ? 'livres' : 'articles'
    const personnelle = donnees.get('partage') === 'personnelle'
    if (!titre) return
    setEnCours(true)
    const id = await onCreer(titre, type, personnelle)
    setEnCours(false)
    if (id) {
      dialogue.current?.close()
      onCreee(id)
    }
  }

  return (
    <dialog className="dialogue" ref={dialogue} onClose={onFerme}>
      <form className="formulaire" onSubmit={soumettre}>
        <h2>Nouvelle liste</h2>
        <label>
          Nom
          <input type="text" name="titre" required placeholder="Quincaillerie, Cadeaux…" autoFocus />
        </label>
        <fieldset>
          <legend>Type</legend>
          <label className="interrupteur">
            <input type="radio" name="type" value="articles" defaultChecked />
            <span>
              <strong>Liste à cocher</strong>
              <small>Épicerie, quincaillerie, tâches…</small>
            </span>
          </label>
          <label className="interrupteur">
            <input type="radio" name="type" value="livres" />
            <span>
              <strong>Livres</strong>
              <small>Titre, auteur, couverture, catégories.</small>
            </span>
          </label>
        </fieldset>
        <fieldset>
          <legend>Partage</legend>
          <label className="interrupteur">
            <input type="radio" name="partage" value="partagee" defaultChecked />
            <span>
              <strong>Partagée avec le ménage</strong>
              <small>Visible et modifiable par tous, en temps réel.</small>
            </span>
          </label>
          <label className="interrupteur">
            <input type="radio" name="partage" value="personnelle" />
            <span>
              <strong>🔒 Personnelle</strong>
              <small>Visible seulement par toi.</small>
            </span>
          </label>
        </fieldset>
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
  )
}
