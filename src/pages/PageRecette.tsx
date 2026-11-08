import { Link, useParams } from 'react-router'
import NavBar from '../composants/NavBar'
import { trouverRecette } from '../data/donnees'
import { cheminImage, formaterDuree } from '../utils/temps'

export default function PageRecette() {
  // :id dans la route "/recettes/:id" → ex. "banh-mi"
  const { id } = useParams()
  const recette = id ? trouverRecette(id) : undefined

  if (!recette) {
    return (
      <div className="page-recette">
        <nav className="barre-retour">
          <Link to="/recettes" className="bouton">← Retour</Link>
        </nav>
        <main>
          <p>Cette recette n'existe pas.</p>
        </main>
        <NavBar />
      </div>
    )
  }

  // On n'affiche que les temps non nuls (convention des zéros).
  const temps = [
    { libelle: 'Préparation', minutes: recette.temps.preparation_min },
    { libelle: 'Cuisson', minutes: recette.temps.cuisson_min },
    { libelle: 'Repos', minutes: recette.temps.repos_min },
  ].filter((t) => t.minutes > 0)

  return (
    <div className="page-recette">
      <nav className="barre-retour">
        <Link to="/recettes" className="bouton">← Retour</Link>
      </nav>

      <header className="entete-app">
        {recette.image && <img src={cheminImage(recette.image)} alt={recette.titre} />}
        <div className="entete-infos">
          <h1>{recette.titre}</h1>
          <div className="meta">
            {temps.map((t) => (
              <div className="meta-item" key={t.libelle}>
                <p>{t.libelle}</p>
                <p className="specific">{formaterDuree(t.minutes)}</p>
              </div>
            ))}
            <div className="meta-item">
              <p>Rendement</p>
              <p className="specific">{recette.rendement}</p>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="ingredients">
          <h2>Ingrédients</h2>
          {recette.ingredients.map((groupe, i) => (
            <div key={i}>
              {groupe.section && <h3>{groupe.section}</h3>}
              <ul>
                {groupe.items.map((ing, j) => (
                  <li key={j}><strong>{ing.nom}</strong> - {ing.quantite}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Pas encore fonctionnel : viendra avec le module Listes */}
        <button type="button" className="bouton bouton-liste">
          🛒 Ajouter les ingrédients à la liste d'épicerie
        </button>

        <div className="instructions">
          <h2>Préparation</h2>
          {recette.etapes.map((groupe, i) => (
            <div key={i}>
              {groupe.section && <h3>{groupe.section}</h3>}
              <ol>
                {groupe.items.map((etape, j) => (
                  <li key={j}>{etape}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {recette.notes.length > 0 && (
          <div className="notes">
            <h2>Notes</h2>
            <ul>
              {recette.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <NavBar />
    </div>
  )
}
