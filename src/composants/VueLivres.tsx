import { useState } from 'react'
import type { Livre, ListeLivres } from '../types/liste'
import { categoriesDe, grouperLivres } from '../utils/listes'
import CouvertureLivre from './CouvertureLivre'
import DialogueLivre from './DialogueLivre'

interface Props {
  liste: ListeLivres
  onAjouter: (livre: Omit<Livre, 'id'>) => void
  onModifier: (livre: Livre) => void
  onSupprimer: (livreId: string) => void
}

// Livres regroupés par catégorie (« Autres » à la fin). Toucher la carte ouvre
// le lien Amazon ; ✏️ ouvre la boîte de modification (et de suppression).
export default function VueLivres({ liste, onAjouter, onModifier, onSupprimer }: Props) {
  // null : boîte fermée ; { livre: null } : ajout ; { livre } : modification.
  const [dialogue, setDialogue] = useState<{ livre: Livre | null } | null>(null)
  const enEdition = dialogue?.livre ?? null
  const groupes = grouperLivres(liste.livres)
  // Sous-titres seulement s'il y a au moins une vraie catégorie.
  const afficherCategories = groupes.length > 1 || (groupes.length === 1 && liste.livres[0]?.categorie.trim() !== '')

  return (
    <>
      {groupes.map((g) => (
        <section key={g.categorie}>
          {afficherCategories && <h2 className="categorie-livres">{g.categorie}</h2>}
          <ul>
            {g.livres.map((livre) => (
              <li key={livre.id} className="carte carte-livre">
                {/* Sans lien Amazon, href={undefined} : la carte n'est pas cliquable. */}
                <a href={livre.lien || undefined} target="_blank" rel="noopener">
                  <CouvertureLivre livre={livre} />
                  <div>
                    <h2>{livre.titre}</h2>
                    <p>{livre.auteur}</p>
                  </div>
                </a>
                <button
                  type="button"
                  className="bouton-discret"
                  aria-label={`Modifier ${livre.titre}`}
                  onClick={() => setDialogue({ livre })}
                >
                  ✏️
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button type="button" className="fab" aria-label="Ajouter un livre" onClick={() => setDialogue({ livre: null })}>
        +
      </button>

      {dialogue && (
        <DialogueLivre
          livre={enEdition}
          categories={categoriesDe(liste.livres)}
          onEnregistrer={(champs) => (enEdition ? onModifier({ ...champs, id: enEdition.id }) : onAjouter(champs))}
          onSupprimer={enEdition ? () => onSupprimer(enEdition.id) : undefined}
          onFerme={() => setDialogue(null)}
        />
      )}
    </>
  )
}
