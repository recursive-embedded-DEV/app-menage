import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import DialogueNouvelleListe from '../composants/DialogueNouvelleListe'
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
  const { listes, chargement, erreur, creerListe } = useListes()
  const naviguer = useNavigate()
  const [creation, setCreation] = useState(false)

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
        {/* Préférences du membre (onglet Nutrition) et déconnexion, rarement utile
            (la session dure) mais nécessaire pour changer de compte. */}
        <p className="liens-compte">
          <Link to="/profil" className="bouton-discret">Mon profil</Link>
          <button type="button" className="bouton-discret" onClick={deconnecter}>
            Se déconnecter
          </button>
        </p>
      </main>
      <button type="button" className="fab" aria-label="Créer une liste" onClick={() => setCreation(true)}>
        +
      </button>
      {creation && (
        <DialogueNouvelleListe
          onCreer={creerListe}
          onCreee={(id) => naviguer(`/listes/${id}`)}
          onFerme={() => setCreation(false)}
        />
      )}
      <NavBar />
    </div>
  )
}
