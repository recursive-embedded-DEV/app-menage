import CarteRecette from '../composants/CarteRecette'
import NavBar from '../composants/NavBar'
import { recettes } from '../data/donnees'

export default function ListeRecettes() {
  return (
    <div className="page-liste">
      <header className="entete-app">
        <h1>Recettes</h1>
      </header>
      <main>
        <ul>
          {recettes.map((recette) => (
            <CarteRecette key={recette.id} recette={recette} />
          ))}
        </ul>
      </main>
      {/* Pas encore fonctionnel : l'ajout viendra avec Supabase */}
      <button type="button" className="fab" aria-label="Créer une recette">+</button>
      <NavBar />
    </div>
  )
}
