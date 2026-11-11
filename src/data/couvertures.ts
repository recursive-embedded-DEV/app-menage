import type { InfosLivre } from '../utils/livres'
import { couvertureAmazon, fusionnerInfos, lireReponseGoogle, lireReponseOpenLibrary } from '../utils/livres'

// Le SEUL fichier qui interroge des services de livres extérieurs, dans cet ordre :
//   1. Google Books : titre, auteurs, couverture ; très bonne couverture des
//      livres récents. Exige une CLÉ d'API (VITE_GOOGLE_BOOKS_KEY) : sans clé,
//      Google refuse les appels (quota de 0). Clé publique (dans le JavaScript)
//      mais RESTREINTE au site dans la console Google : inutilisable ailleurs.
//      Sans clé configurée, cette étape est simplement sautée.
//   2. Open Library : gratuit, sans clé ; complète ce qui manque.
//   3. Image d'Amazon par le code du lien : dernier recours, couverture seulement.
// Seuls l'ISBN, ou le titre et l'auteur, sont envoyés.

const CLE_GOOGLE = import.meta.env.VITE_GOOGLE_BOOKS_KEY
const GOOGLE_BOOKS = 'https://www.googleapis.com/books/v1/volumes'
const OPEN_LIBRARY = 'https://openlibrary.org/search.json'

// Adresse de la couverture Open Library d'une ÉDITION (ISBN). default=false :
// erreur 404 plutôt qu'une image vide quand l'édition n'a pas de couverture.
export function couvertureOpenLibrary(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`
}

interface Recherche {
  isbn: string
  asin: string // code du lien Amazon (ISBN ou code Kindle « B0… ») ; "" si aucun
  titre: string
  auteur: string
}

async function chercherGoogle({ isbn, titre, auteur }: Recherche): Promise<InfosLivre | null> {
  if (!CLE_GOOGLE) return null
  const q = isbn ? `isbn:${isbn}` : [titre && `intitle:${titre}`, auteur && `inauthor:${auteur}`].filter(Boolean).join(' ')
  if (!q) return null
  const parametres = new URLSearchParams({ q, maxResults: '1', key: CLE_GOOGLE })
  const reponse = await fetch(`${GOOGLE_BOOKS}?${parametres}`)
  if (!reponse.ok) return null
  return lireReponseGoogle(await reponse.json())
}

async function rechercheOpenLibrary(parametres: Record<string, string>): Promise<InfosLivre | null> {
  const requete = new URLSearchParams({ ...parametres, limit: '1', fields: 'title,author_name,cover_i' })
  const reponse = await fetch(`${OPEN_LIBRARY}?${requete}`)
  if (!reponse.ok) return null
  return lireReponseOpenLibrary(await reponse.json())
}

// Par ISBN si on l'a ; sinon (ou si l'ISBN ne donne rien) par titre ET auteur.
// Le titre seul est trompeur (plusieurs livres portent le même titre).
async function chercherOpenLibrary({ isbn, titre, auteur }: Recherche): Promise<InfosLivre | null> {
  const parIsbn = isbn ? await rechercheOpenLibrary({ isbn }) : null
  if (parIsbn) return parIsbn
  return titre && auteur ? rechercheOpenLibrary({ title: titre, author: auteur }) : null
}

// L'image existe-t-elle ? On la CHARGE (comme le ferait la page) : une image
// se charge depuis n'importe quel site, alors qu'un fetch peut être bloqué
// (CORS). Amazon renvoie une image de 1 × 1 pixel quand il n'en a pas.
function imageExiste(adresse: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image.naturalWidth > 1)
    image.onerror = () => resolve(false)
    image.src = adresse
  })
}

// Titre, auteur et couverture d'un livre, en combinant les 3 sources.
// Une source en panne n'empêche pas les autres (.catch → null).
export async function chercherInfosLivre(recherche: Recherche): Promise<InfosLivre | null> {
  const [google, openLibrary] = await Promise.all([
    chercherGoogle(recherche).catch(() => null),
    chercherOpenLibrary(recherche).catch(() => null),
  ])
  const infos = fusionnerInfos(google, openLibrary)
  if (infos?.couverture || !recherche.asin) return infos

  // Pas de couverture : dernier recours, l'image d'Amazon par le code du lien.
  const adresse = couvertureAmazon(recherche.asin)
  return (await imageExiste(adresse)) ? fusionnerInfos(infos, { titre: '', auteur: '', couverture: adresse }) : infos
}
