import { useRef } from 'react'
import type { FormEvent } from 'react'
import type { Livre } from '../types/liste'

interface Props {
  onAjouter: (livre: Omit<Livre, 'id'>) => void
}

// Le bouton + et sa boîte de dialogue. Même logique que ton livres.js,
// mais React s'occupe de créer la carte : on ne fait qu'ajouter des données.
export default function DialogueLivre({ onAjouter }: Props) {
  // useRef : une « poignée » vers le vrai <dialog> du DOM, pour appeler
  // showModal() et close(), qui n'ont pas d'équivalent en React.
  const dialogue = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)

  function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const donnees = new FormData(e.currentTarget)
    const lire = (nom: string) => String(donnees.get(nom) ?? '').trim()

    onAjouter({
      titre: lire('titre'),
      auteur: lire('auteur'),
      lien: lire('lien'),
      isbn: lire('isbn').replace(/\D/g, ''),
      image: '',
    })
    dialogue.current?.close()
  }

  return (
    <>
      <dialog className="dialogue" ref={dialogue} onClose={() => form.current?.reset()}>
        <form className="formulaire" ref={form} onSubmit={soumettre}>
          <h2>Nouveau livre</h2>
          <label>Titre <input type="text" name="titre" required /></label>
          <label>Auteur <input type="text" name="auteur" required /></label>
          <label>Lien Amazon <input type="url" name="lien" /></label>
          <label>ISBN <input type="text" name="isbn" /></label>
          <div className="dialogue-actions">
            <button type="button" className="bouton" onClick={() => dialogue.current?.close()}>Annuler</button>
            <button type="submit" className="bouton">Ajouter</button>
          </div>
        </form>
      </dialog>
      <button type="button" className="fab" aria-label="Ajouter un livre" onClick={() => dialogue.current?.showModal()}>
        +
      </button>
    </>
  )
}
