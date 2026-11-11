import { Link } from 'react-router'
import type { ResumeRecette } from '../types/recette'
import { cheminImage, formaterDuree, tempsTotal } from '../utils/temps'

interface Props {
  recette: ResumeRecette // la liste ne charge pas les ingrédients ni les étapes
}

export default function CarteRecette({ recette }: Props) {
  return (
    <li className="carte">
      <Link to={`/recettes/${recette.id}`}>
        {recette.image ? (
          <img src={cheminImage(recette.image)} alt={recette.titre} />
        ) : (
          <div className="vignette-vide" aria-hidden="true">🍴</div>
        )}
        <div>
          <h2>{recette.titre}</h2>
          <p>{formaterDuree(tempsTotal(recette))} · {recette.rendement}</p>
        </div>
      </Link>
    </li>
  )
}
