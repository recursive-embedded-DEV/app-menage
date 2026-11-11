import CarteRecette from '../composants/CarteRecette'
import NavBar from '../composants/NavBar'
import { useRecettes } from '../hooks/useRecettes'

export default function ListeRecettes() {
  const { recettes, chargement, erreur } = useRecettes()

  return (
    <div className="page-liste">
      <header className="entete-app">
        <h1>Recettes</h1>
      </header>
      <main>
        {chargement && <p>Chargement…</p>}
        {erreur && <p className="message-erreur">Impossible de charger les recettes. Vérifie ta connexion.</p>}
        <ul>
          {recettes.map((recette) => (
            <CarteRecette key={recette.id} recette={recette} />
          ))}
        </ul>
      </main>
      {/* Pas encore fonctionnel : l'ajout viendra à l'étape R3 */}
      <button type="button" className="fab" aria-label="Créer une recette">+</button>
      <NavBar />
    </div>
  )
}
