import type { Livre, ListeLivres } from '../types/liste'
import CouvertureLivre from './CouvertureLivre'
import DialogueLivre from './DialogueLivre'

interface Props {
  liste: ListeLivres
  onAjouter: (livre: Omit<Livre, 'id'>) => void
}

export default function VueLivres({ liste, onAjouter }: Props) {
  return (
    <>
      <ul>
        {liste.livres.map((livre) => (
          <li key={livre.id} className="carte">
            {/* Sans lien Amazon, href={undefined} : la carte n'est pas cliquable. */}
            <a href={livre.lien || undefined} target="_blank" rel="noopener">
              <CouvertureLivre livre={livre} />
              <div>
                <h2>{livre.titre}</h2>
                <p>{livre.auteur}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <DialogueLivre onAjouter={onAjouter} />
    </>
  )
}
