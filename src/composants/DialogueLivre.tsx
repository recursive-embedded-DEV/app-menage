import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Livre } from '../types/liste'
import { chercherInfosLivre } from '../data/couvertures'
import { extraireAsin, isbnDepuisLien, nettoyerIsbn } from '../utils/livres'
import { cheminImage } from '../utils/temps'

interface Props {
  livre: Livre | null // null : ajout ; sinon : modification de ce livre
  categories: string[] // catégories existantes (suggestions)
  onEnregistrer: (livre: Omit<Livre, 'id'>) => void
  onSupprimer?: () => void // modification seulement
  onFerme: () => void
}

// Ajout OU modification d'un livre. Coller le lien Amazon d'un livre imprimé
// suffit souvent : l'ISBN en est tiré, puis titre, auteur et couverture sont
// cherchés (Google Books, Open Library, image d'Amazon). Monté à l'ouverture, démonté à la
// fermeture (son état repart à zéro), comme les autres boîtes de l'app.
export default function DialogueLivre({ livre, categories, onEnregistrer, onSupprimer, onFerme }: Props) {
  // useRef : une « poignée » vers le vrai <dialog> du DOM, pour appeler
  // showModal() et close(), qui n'ont pas d'équivalent en React.
  const dialogue = useRef<HTMLDialogElement>(null)
  // Champs CONTRÔLÉS (React détient leur valeur) : la recherche peut les remplir.
  const [champs, setChamps] = useState({
    lien: livre?.lien ?? '',
    titre: livre?.titre ?? '',
    auteur: livre?.auteur ?? '',
    categorie: livre?.categorie ?? '',
    isbn: livre?.isbn ?? '',
    image: livre?.image ?? '', // fichier de public/img/ ou adresse complète
  })
  const [recherche, setRecherche] = useState<'repos' | 'en-cours' | 'rien'>('repos')
  const [confirmer, setConfirmer] = useState(false)

  useEffect(() => {
    dialogue.current?.showModal()
  }, [])

  const maj = (modifs: Partial<typeof champs>) => setChamps((actuels) => ({ ...actuels, ...modifs }))

  // Cherche titre, auteur et couverture. Ne remplit que les champs VIDES :
  // ce que l'utilisateur a tapé n'est jamais écrasé (la couverture, elle, est
  // remplacée quand on relance la recherche à la main).
  // Le lien est passé en paramètre : juste après un collage, champs.lien
  // contient encore l'ANCIENNE valeur (l'état n'est à jour qu'au rendu suivant).
  async function chercher(
    base: { isbn: string; titre: string; auteur: string; lien: string },
    remplacerCouverture: boolean,
  ) {
    setRecherche('en-cours')
    // Le code du lien Amazon sert de dernier recours pour la couverture.
    const asin = extraireAsin(base.lien) ?? ''
    const infos = await chercherInfosLivre({ isbn: base.isbn, titre: base.titre, auteur: base.auteur, asin }).catch(() => null)
    if (!infos) {
      setRecherche('rien')
      return
    }
    setChamps((actuels) => ({
      ...actuels,
      titre: actuels.titre || infos.titre,
      auteur: actuels.auteur || infos.auteur,
      image: infos.couverture && (remplacerCouverture || !actuels.image) ? infos.couverture : actuels.image,
    }))
    setRecherche(infos.couverture && infos.titre ? 'repos' : 'rien')
  }

  // Lien collé : recherche automatique quand il contient un NOUVEAU code Amazon.
  //   - livre imprimé : l'ISBN est tiré du lien → titre, auteur, couverture ;
  //   - livre Kindle (« B0… ») : pas d'ISBN, mais l'image d'Amazon donne la couverture.
  function changerLien(lien: string) {
    const isbn = isbnDepuisLien(lien)
    const nouveauCode = extraireAsin(lien) !== null && extraireAsin(lien) !== extraireAsin(champs.lien)
    if (isbn && isbn !== champs.isbn) {
      maj({ lien, isbn })
      chercher({ isbn, titre: champs.titre, auteur: champs.auteur, lien }, false)
    } else if (nouveauCode) {
      maj({ lien })
      chercher({ isbn: nettoyerIsbn(champs.isbn), titre: champs.titre, auteur: champs.auteur, lien }, false)
    } else {
      maj({ lien })
    }
  }

  function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onEnregistrer({
      titre: champs.titre.trim(),
      auteur: champs.auteur.trim(),
      lien: champs.lien.trim(),
      isbn: nettoyerIsbn(champs.isbn),
      image: champs.image,
      categorie: champs.categorie.trim(),
    })
    dialogue.current?.close()
  }

  // Aperçu : la couverture trouvée, ou à défaut celle d'Open Library (ISBN).
  const apercu = champs.image ? cheminImage(champs.image) : ''

  return (
    <dialog id="dialogue-livre" className="dialogue" ref={dialogue} onClose={onFerme}>
      <form className="formulaire" onSubmit={soumettre}>
        <h2>{livre ? 'Modifier le livre' : 'Nouveau livre'}</h2>
        <label>
          Lien Amazon <small>(le coller remplit le reste s'il s'agit d'un livre imprimé)</small>
          <input type="url" value={champs.lien} onChange={(e) => changerLien(e.target.value)} placeholder="https://www.amazon.ca/dp/…" />
        </label>
        <label>
          Titre <input type="text" required value={champs.titre} onChange={(e) => maj({ titre: e.target.value })} />
        </label>
        <label>
          Auteur <input type="text" required value={champs.auteur} onChange={(e) => maj({ auteur: e.target.value })} />
        </label>
        <label>
          Catégorie <small>(facultatif)</small>
          {/* list + <datalist> : le navigateur propose les catégories existantes,
              mais on peut aussi en taper une nouvelle. */}
          <input
            type="text"
            list="categories-livres"
            value={champs.categorie}
            onChange={(e) => maj({ categorie: e.target.value })}
            placeholder="Leadership, Finances…"
          />
          <datalist id="categories-livres">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          ISBN <input type="text" inputMode="numeric" value={champs.isbn} onChange={(e) => maj({ isbn: e.target.value })} />
        </label>

        <fieldset>
          <legend>Couverture</legend>
          <div className="couverture-livre">
            {apercu ? <img src={apercu} alt="Couverture trouvée" /> : <span className="couverture-vide">📕</span>}
            <div>
              <button
                type="button"
                className="bouton-discret"
                disabled={recherche === 'en-cours' || !(champs.isbn || champs.titre || extraireAsin(champs.lien))}
                onClick={() =>
                  chercher({ isbn: nettoyerIsbn(champs.isbn), titre: champs.titre, auteur: champs.auteur, lien: champs.lien }, true)
                }
              >
                {recherche === 'en-cours' ? 'Recherche…' : '🔎 Chercher la couverture'}
              </button>
              {recherche === 'rien' && (
                <p className="note-portions">
                  Livre introuvable ou incomplet dans les bases : tape le titre et l'auteur, puis relance la recherche.
                </p>
              )}
              {champs.image && (
                <button type="button" className="bouton-discret" onClick={() => maj({ image: '' })}>
                  Retirer la couverture
                </button>
              )}
            </div>
          </div>
        </fieldset>

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
