import { Link } from 'react-router'
import CarteRecette from '../composants/CarteRecette'
import NavBar from '../composants/NavBar'
import { useConnexion } from '../hooks/useConnexion'
import { useRecettes } from '../hooks/useRecettes'

export default function ListeRecettes() {
  const { recettes, chargement, erreur } = useRecettes()
  const connexion = useConnexion()

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
      {/* Ajouter une recette : membres connectés seulement. */}
      {connexion === 'connecte' && (
        <Link to="/recettes/nouvelle" className="fab" aria-label="Ajouter une recette">
          +
        </Link>
      )}
      <NavBar />
    </div>
  )
}
