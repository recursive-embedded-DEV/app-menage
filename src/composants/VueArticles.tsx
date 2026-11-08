import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ListeArticles } from '../types/liste'

interface Props {
  liste: ListeArticles
  onAjouter: (texte: string) => void
  onBasculer: (articleId: string) => void
  onSupprimer: (articleId: string) => void
  onRetirerCoches: () => void
}

export default function VueArticles({ liste, onAjouter, onBasculer, onSupprimer, onRetirerCoches }: Props) {
  // Champ « contrôlé » : React détient la valeur ; l'input ne fait que l'afficher.
  const [texte, setTexte] = useState('')

  function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const propre = texte.trim()
    if (!propre) return
    onAjouter(propre)
    setTexte('')
  }

  const nbCoches = liste.articles.filter((a) => a.coche).length

  return (
    <>
      <ul>
        {liste.articles.map((article) => (
          <li key={article.id} className="article">
            <label>
              <input type="checkbox" checked={article.coche} onChange={() => onBasculer(article.id)} />
              <span>{article.texte}</span>
            </label>
            <button type="button" className="bouton-supprimer" aria-label={`Supprimer ${article.texte}`} onClick={() => onSupprimer(article.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* Un vrai <form> : la touche Entrée du clavier ajoute l'article. */}
      <form className="ajout" onSubmit={soumettre}>
        <input type="text" placeholder="Ajouter un article" value={texte} onChange={(e) => setTexte(e.target.value)} />
        <button type="submit" className="bouton">+</button>
      </form>

      {nbCoches > 0 && (
        <button type="button" className="bouton bouton-liste bouton-retirer" onClick={onRetirerCoches}>
          Retirer les articles cochés ({nbCoches})
        </button>
      )}
    </>
  )
}
