import { Link, useParams } from 'react-router'
import NavBar from '../composants/NavBar'
import VueArticles from '../composants/VueArticles'
import VueLivres from '../composants/VueLivres'
import { useListes } from '../hooks/useListes'

export default function PageListe() {
  const { id } = useParams()
  const { listes, chargement, erreur, ajouterArticle, basculerArticle, supprimerArticle, retirerCoches, ajouterLivre } =
    useListes()
  const liste = listes.find((l) => l.id === id)
  // Pendant le chargement, la liste n'est pas encore là : sans ce test, on
  // afficherait brièvement « Liste introuvable » à chaque ouverture.
  const introuvable = !chargement && !liste

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
          <VueLivres liste={liste} onAjouter={(livre) => ajouterLivre(liste.id, livre)} />
        )}
      </main>
      <NavBar />
    </div>
  )
}
