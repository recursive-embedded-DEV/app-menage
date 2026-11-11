import { useState } from 'react'
import type { Livre } from '../types/liste'
import { couvertureOpenLibrary } from '../data/couvertures'
import { cheminImage } from '../utils/temps'

// Image enregistrée si on en a une (fichier de public/img/ ou adresse trouvée
// par la recherche de couverture), sinon couverture Open Library via l'ISBN.
// Si Open Library ne l'a pas (ex. ISBN 979-8 autoédité), on n'affiche rien.
export default function CouvertureLivre({ livre }: { livre: Livre }) {
  const [echec, setEchec] = useState(false)

  const src = livre.image
    ? cheminImage(livre.image)
    : livre.isbn
      ? couvertureOpenLibrary(livre.isbn)
      : ''

  if (!src || echec) return null

  // En React, on ne retire pas l'élément du DOM soi-même (img.remove()) :
  // on change l'état, et React décide de ne plus l'afficher.
  return <img src={src} alt={`Couverture de ${livre.titre}`} onError={() => setEchec(true)} />
}
