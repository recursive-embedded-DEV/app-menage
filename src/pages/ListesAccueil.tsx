import { Link } from 'react-router'
import NavBar from '../composants/NavBar'
import { deconnecter } from '../data/auth'
import { useListes } from '../hooks/useListes'
import type { Liste } from '../types/liste'

// Petit résumé sous le titre de chaque liste.
function resume(liste: Liste): string {
  if (liste.type === 'livres') return `${liste.livres.length} livre(s)`
  const restants = liste.articles.filter((a) => !a.coche).length
  return `${restants} article(s) à acheter`
}

export default function ListesAccueil() {
  const { listes, chargement, erreur } = useListes()

  return (
    <div className="page-liste">
      <header className="entete-app">
        <h1>Listes</h1>
      </header>
      <main>
        {erreur && <p className="message-erreur">{erreur}</p>}
        {chargement && <p>Chargement…</p>}
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
        {/* Rarement utile (la session dure), mais nécessaire pour changer de compte. */}
        <button type="button" className="bouton-discret bouton-deconnexion" onClick={deconnecter}>
          Se déconnecter
        </button>
      </main>
      {/* Pas encore fonctionnel : la création de listes viendra plus tard */}
      <button type="button" className="fab" aria-label="Créer une liste">+</button>
      <NavBar />
    </div>
  )
}
