import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import NavBar from '../composants/NavBar'
import VueArticles from '../composants/VueArticles'
import VueLivres from '../composants/VueLivres'
import { useListes } from '../hooks/useListes'

// La liste d'épicerie reçoit les ingrédients des recettes (useAjoutEpicerie) :
// elle ne peut pas être supprimée (elle reste renommable).
const LISTE_PROTEGEE = 'epicerie'

export default function PageListe() {
  const { id } = useParams()
  const naviguer = useNavigate()
  const {
    listes,
    chargement,
    erreur,
    ajouterArticle,
    basculerArticle,
    supprimerArticle,
    retirerCoches,
    ajouterLivre,
    modifierLivre,
    supprimerLivre,
    renommerListe,
    supprimerListe,
  } = useListes()
  const liste = listes.find((l) => l.id === id)
  // Pendant le chargement, la liste n'est pas encore là : sans ce test, on
  // afficherait brièvement « Liste introuvable » à chaque ouverture.
  const introuvable = !chargement && !liste

  // Gestion de la liste : renommer (champ en place) ou supprimer (confirmation).
  const [mode, setMode] = useState<'normal' | 'renommer' | 'supprimer'>('normal')
  const [nouveauTitre, setNouveauTitre] = useState('')

  return (
    // Les livres gardent leur classe à eux (vignettes en format portrait).
    <div className={liste?.type === 'livres' ? 'page-liste page-livres' : 'page-liste'}>
      <nav className="barre-retour">
        <Link to="/listes" className="bouton">← Retour</Link>
      </nav>
      <header className="entete-app">
        <h1>{liste ? liste.titre : introuvable ? 'Liste introuvable' : 'Listes'}</h1>
      </header>
      <main>
        {erreur && <p className="message-erreur">{erreur}</p>}
        {chargement && <p>Chargement…</p>}
        {introuvable && <p>Cette liste n'existe pas.</p>}

        {/* Grâce à l'union discriminée, TypeScript sait que liste.articles
            existe dans la première branche, et liste.livres dans la seconde. */}
        {liste?.type === 'articles' && (
          <VueArticles
            liste={liste}
            onAjouter={(texte) => ajouterArticle(liste.id, texte)}
            onBasculer={(articleId) => basculerArticle(liste.id, articleId)}
            onSupprimer={(articleId) => supprimerArticle(liste.id, articleId)}
            onRetirerCoches={() => retirerCoches(liste.id)}
          />
        )}
        {liste?.type === 'livres' && (
          <VueLivres
            liste={liste}
            onAjouter={(livre) => ajouterLivre(liste.id, livre)}
            onModifier={(livre) => modifierLivre(liste.id, livre)}
            onSupprimer={(livreId) => supprimerLivre(liste.id, livreId)}
          />
        )}

        {liste && mode === 'normal' && (
          <p className="liens-compte">
            <button
              type="button"
              className="bouton-discret"
              onClick={() => {
                setNouveauTitre(liste.titre)
                setMode('renommer')
              }}
            >
              Renommer la liste
            </button>
            {liste.id !== LISTE_PROTEGEE && (
              <button type="button" className="bouton-discret" onClick={() => setMode('supprimer')}>
                Supprimer la liste
              </button>
            )}
          </p>
        )}

        {liste && mode === 'renommer' && (
          <form
            className="ajout"
            onSubmit={(e) => {
              e.preventDefault()
              const titre = nouveauTitre.trim()
              if (titre) renommerListe(liste.id, titre)
              setMode('normal')
            }}
          >
            <input type="text" aria-label="Nouveau nom" value={nouveauTitre} onChange={(e) => setNouveauTitre(e.target.value)} autoFocus />
            <button type="submit" className="bouton">OK</button>
            <button type="button" className="bouton-discret" onClick={() => setMode('normal')}>
              Annuler
            </button>
          </form>
        )}

        {/* Confirmation intégrée (confirm() est peu fiable dans une app installée). */}
        {liste && mode === 'supprimer' && (
          <div className="confirmation-suppression" role="alertdialog" aria-label="Confirmer la suppression">
            <p>
              Supprimer « {liste.titre} » et tout son contenu ({liste.type === 'articles' ? liste.articles.length : liste.livres.length}{' '}
              {liste.type === 'articles' ? 'article(s)' : 'livre(s)'}) ?
            </p>
            <div className="dialogue-actions">
              <button type="button" className="bouton" onClick={() => setMode('normal')}>
                Non
              </button>
              <button
                type="button"
                className="bouton bouton-danger"
                onClick={async () => {
                  if (await supprimerListe(liste.id)) naviguer('/listes', { replace: true })
                  else setMode('normal')
                }}
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        )}
      </main>
      <NavBar />
    </div>
  )
}
