import { useCallback, useEffect, useState } from 'react'
import type { Livre, Liste, TypeListe } from '../types/liste'
import { creerIdentifiant } from '../utils/identifiants'
import {
  chargerListes,
  creerListe as creerListeStockee,
  ecouterChangements,
  identifiantListeLibre,
  insererArticle,
  insererLivre,
  modifierCoche,
  modifierLivre as modifierLivreStocke,
  renommerListe as renommerListeStockee,
  supprimerArticle as supprimerArticleStocke,
  supprimerCoches,
  supprimerListe as supprimerListeStockee,
  supprimerLivre as supprimerLivreStocke,
} from '../data/stockage-listes'

// Un « hook » maison : il regroupe l'état des listes ET toutes les
// opérations permises dessus. Les composants n'ont qu'à l'appeler :
//   const { listes, ajouterArticle } = useListes()
export function useListes() {
  // Les listes arrivent maintenant par le réseau : on démarre vide, avec
  // un indicateur de chargement, et un message si quelque chose échoue.
  const [listes, setListes] = useState<Liste[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  // Va chercher l'état réel des listes dans la base.
  // useCallback garde la MÊME fonction d'un rendu à l'autre, pour que
  // l'useEffect ci-dessous ne se relance pas à chaque rendu.
  // Les setState sont dans des rappels (.then, .catch…) : ils ne s'exécutent
  // qu'à l'arrivée de la réponse du réseau, jamais pendant l'effet lui-même.
  const recharger = useCallback(() => {
    chargerListes()
      .then((resultat) => {
        setListes(resultat)
        setErreur(null)
      })
      .catch(() => setErreur('Impossible de charger les listes. Vérifie ta connexion.'))
      .finally(() => setChargement(false))
  }, [])

  useEffect(() => {
    recharger()

    // Plusieurs événements arrivent souvent d'un coup (ex. « Retirer les
    // articles cochés » supprime plusieurs lignes) : on attend 300 ms
    // d'accalmie avant de recharger, une seule fois.
    let minuterie: number | undefined
    const rechargerBientot = () => {
      window.clearTimeout(minuterie)
      minuterie = window.setTimeout(recharger, 300)
    }

    // 1. Temps réel : un changement fait sur l'autre téléphone.
    const arreterEcoute = ecouterChangements(rechargerBientot)

    // 2. Retour dans l'app (téléphone déverrouillé, onglet réaffiché) :
    // la connexion temps réel a pu être coupée pendant la veille.
    const surVisibilite = () => {
      if (document.visibilityState === 'visible') rechargerBientot()
    }
    document.addEventListener('visibilitychange', surVisibilite)

    // Nettoyage quand la page se démonte : sinon les écoutes s'accumulent.
    return () => {
      window.clearTimeout(minuterie)
      arreterEcoute()
      document.removeEventListener('visibilitychange', surVisibilite)
    }
  }, [recharger])

  // MISE À JOUR OPTIMISTE :
  //   1. on change l'écran tout de suite (même transformation qu'avant) ;
  //   2. on envoie la requête à Supabase ;
  //   3. si elle échoue, on affiche un message et on recharge l'état réel.
  // L'app reste rapide même avec un mauvais réseau à l'épicerie.
  // Règle d'or de React : `transformer` produit une NOUVELLE liste (.map, ...).
  function executer(listeId: string, transformer: (liste: Liste) => Liste, requete: () => Promise<void>) {
    setListes((actuelles) => actuelles.map((l) => (l.id === listeId ? transformer(l) : l)))
    requete().catch(() => {
      setErreur("La modification n'a pas été enregistrée. Vérifie ta connexion.")
      recharger()
    })
  }

  function ajouterArticle(listeId: string, texte: string) {
    const article = { id: crypto.randomUUID(), texte, coche: false }
    executer(
      listeId,
      (l) => (l.type === 'articles' ? { ...l, articles: [...l.articles, article] } : l),
      () => insererArticle(listeId, article),
    )
  }

  function basculerArticle(listeId: string, articleId: string) {
    // On calcule la nouvelle valeur ici, car la base a besoin de la valeur
    // exacte (« coche = true ») et non d'un « inverse ».
    const liste = listes.find((l) => l.id === listeId)
    const article = liste?.type === 'articles' ? liste.articles.find((a) => a.id === articleId) : undefined
    if (!article) return
    const coche = !article.coche

    executer(
      listeId,
      (l) =>
        l.type === 'articles'
          ? { ...l, articles: l.articles.map((a) => (a.id === articleId ? { ...a, coche } : a)) }
          : l,
      () => modifierCoche(articleId, coche),
    )
  }

  function supprimerArticle(listeId: string, articleId: string) {
    executer(
      listeId,
      (l) => (l.type === 'articles' ? { ...l, articles: l.articles.filter((a) => a.id !== articleId) } : l),
      () => supprimerArticleStocke(articleId),
    )
  }

  function retirerCoches(listeId: string) {
    executer(
      listeId,
      (l) => (l.type === 'articles' ? { ...l, articles: l.articles.filter((a) => !a.coche) } : l),
      () => supprimerCoches(listeId),
    )
  }

  function ajouterLivre(listeId: string, livre: Omit<Livre, 'id'>) {
    const nouveau = { ...livre, id: crypto.randomUUID() }
    executer(
      listeId,
      (l) => (l.type === 'livres' ? { ...l, livres: [...l.livres, nouveau] } : l),
      () => insererLivre(listeId, nouveau),
    )
  }

  function modifierLivre(listeId: string, livre: Livre) {
    executer(
      listeId,
      (l) => (l.type === 'livres' ? { ...l, livres: l.livres.map((x) => (x.id === livre.id ? livre : x)) } : l),
      () => modifierLivreStocke(livre),
    )
  }

  function supprimerLivre(listeId: string, livreId: string) {
    executer(
      listeId,
      (l) => (l.type === 'livres' ? { ...l, livres: l.livres.filter((x) => x.id !== livreId) } : l),
      () => supprimerLivreStocke(livreId),
    )
  }

  // ---- Les listes elles-mêmes ----

  // Création : on ATTEND la base (pas d'optimisme), car il faut l'identifiant
  // définitif pour ouvrir la nouvelle liste. Renvoie cet identifiant, ou null.
  async function creerListe(titre: string, type: TypeListe): Promise<string | null> {
    try {
      const id = await identifiantListeLibre(creerIdentifiant(titre) || 'liste')
      await creerListeStockee(id, titre, type)
      setListes((actuelles) => [
        ...actuelles,
        type === 'articles' ? { id, titre, type, articles: [] } : { id, titre, type, livres: [] },
      ])
      return id
    } catch {
      setErreur("La liste n'a pas été créée. Vérifie ta connexion.")
      return null
    }
  }

  function renommerListe(listeId: string, titre: string) {
    executer(listeId, (l) => ({ ...l, titre }), () => renommerListeStockee(listeId, titre))
  }

  // PAS optimiste : la page revient ensuite à l'accueil, qui recharge les
  // listes ; sans attendre la base, la liste supprimée y réapparaîtrait un
  // instant. Renvoie true si la suppression a réussi.
  async function supprimerListe(listeId: string): Promise<boolean> {
    try {
      await supprimerListeStockee(listeId)
      setListes((actuelles) => actuelles.filter((l) => l.id !== listeId))
      return true
    } catch {
      setErreur("La liste n'a pas été supprimée. Vérifie ta connexion.")
      return false
    }
  }

  return {
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
    creerListe,
    renommerListe,
    supprimerListe,
  }
}
