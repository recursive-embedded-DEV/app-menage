import { useEffect, useState } from 'react'
import type { Livre, Liste } from '../types/liste'
import { chargerListes, enregistrerListes } from '../data/stockage-listes'

// Un « hook » maison : il regroupe l'état des listes ET toutes les
// opérations permises dessus. Les composants n'ont qu'à l'appeler :
//   const { listes, ajouterArticle } = useListes()
export function useListes() {
  // On passe la FONCTION chargerListes (sans parenthèses) : React ne
  // l'appelle qu'une fois, au premier affichage, et pas à chaque rendu.
  const [listes, setListes] = useState<Liste[]>(chargerListes)

  // Chaque fois que `listes` change, on enregistre.
  useEffect(() => {
    enregistrerListes(listes)
  }, [listes])

  // Règle d'or de React : on ne modifie jamais l'état directement.
  // On fabrique une NOUVELLE liste (avec .map, ...) et on la donne à setListes.
  function modifierListe(id: string, transformer: (liste: Liste) => Liste) {
    setListes((actuelles) => actuelles.map((l) => (l.id === id ? transformer(l) : l)))
  }

  function ajouterArticle(listeId: string, texte: string) {
    modifierListe(listeId, (l) =>
      l.type === 'articles'
        ? { ...l, articles: [...l.articles, { id: crypto.randomUUID(), texte, coche: false }] }
        : l,
    )
  }

  function basculerArticle(listeId: string, articleId: string) {
    modifierListe(listeId, (l) =>
      l.type === 'articles'
        ? { ...l, articles: l.articles.map((a) => (a.id === articleId ? { ...a, coche: !a.coche } : a)) }
        : l,
    )
  }

  function supprimerArticle(listeId: string, articleId: string) {
    modifierListe(listeId, (l) =>
      l.type === 'articles' ? { ...l, articles: l.articles.filter((a) => a.id !== articleId) } : l,
    )
  }

  function retirerCoches(listeId: string) {
    modifierListe(listeId, (l) =>
      l.type === 'articles' ? { ...l, articles: l.articles.filter((a) => !a.coche) } : l,
    )
  }

  function ajouterLivre(listeId: string, livre: Omit<Livre, 'id'>) {
    modifierListe(listeId, (l) =>
      l.type === 'livres' ? { ...l, livres: [...l.livres, { ...livre, id: crypto.randomUUID() }] } : l,
    )
  }

  return { listes, ajouterArticle, basculerArticle, supprimerArticle, retirerCoches, ajouterLivre }
}
