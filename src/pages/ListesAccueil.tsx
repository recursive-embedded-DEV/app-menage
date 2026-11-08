import { Link } from 'react-router'
import NavBar from '../composants/NavBar'
import { useListes } from '../hooks/useListes'
import type { Liste } from '../types/liste'

// Petit résumé sous le titre de chaque liste.
function resume(liste: Liste): string {
  if (liste.type === 'livres') return `${liste.livres.length} livre(s)`
  const restants = liste.articles.filter((a) => !a.coche).length
  return `${restants} article(s) à acheter`
}

export default function ListesAccueil() {
  const { listes } = useListes()

  return (
    <div className="page-liste">
      <header className="entete-app">
        <h1>Listes</h1>
      </header>
      <main>
        <ul>
          {listes.map((liste) => (
            <li key={liste.id} className="carte">
              <Link to={`/listes/${liste.id}`}>
                <div>
                  <h2>{liste.titre}</h2>
                  <p>{resume(liste)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      {/* Pas encore fonctionnel : la création de listes viendra plus tard */}
      <button type="button" className="fab" aria-label="Créer une liste">+</button>
      <NavBar />
    </div>
  )
}
