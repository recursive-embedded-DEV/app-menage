// Logique PURE pour remplir un livre à partir de son lien Amazon
// (testée dans livres.test.ts). Les appels réseau sont dans data/couvertures.ts.

// Code produit d'Amazon (ASIN) dans un lien. Pour un livre IMPRIMÉ, c'est son
// ISBN-10 ; pour un livre Kindle, un code « B0… ». Les liens raccourcis
// (a.co, amzn.to) ne contiennent pas le code : il faudrait suivre la
// redirection, ce que le navigateur interdit vers un autre site (CORS).
export function extraireAsin(lien: string): string | null {
  // /dp/…, /gp/product/…, /gp/aw/d/… (mobile), /exec/obidos/ASIN/…, ou ?asin=…
  // (?![A-Z0-9]) : le code fait EXACTEMENT 10 caractères (pas 11 ou plus).
  const m = lien.match(/(?:\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|product)\/|[?&]asin=)([A-Z0-9]{10})(?![A-Z0-9])/i)
  return m ? m[1].toUpperCase() : null
}

// Vrai ISBN-10 ? 9 chiffres puis un chiffre ou X (= 10), et le chiffre de
// contrôle : 10×c1 + 9×c2 + … + 1×c10 doit être un multiple de 11.
// C'est ce qui distingue un ISBN d'un ASIN Kindle de même longueur.
export function estIsbn10(code: string): boolean {
  if (!/^\d{9}[\dX]$/.test(code)) return false
  const somme = [...code].reduce((s, c, i) => s + (10 - i) * (c === 'X' ? 10 : Number(c)), 0)
  return somme % 11 === 0
}

// ISBN déduit du lien Amazon (livre imprimé seulement), sinon null.
export function isbnDepuisLien(lien: string): string | null {
  const asin = extraireAsin(lien)
  return asin && estIsbn10(asin) ? asin : null
}

// ISBN tel que saisi → chiffres seulement, en gardant le X final d'un ISBN-10
// (« 0-8044-2957-X » → « 080442957X »).
export function nettoyerIsbn(texte: string): string {
  return texte.replace(/[^0-9Xx]/g, '').toUpperCase()
}

// ---------------------------------------------------------------------
// Open Library, recherche (https://openlibrary.org/search.json) : gratuite,
// sans clé, et elle accepte les appels depuis n'importe quel site (CORS).
// (Google Books, lui, exige une clé : voir plus bas.)
// ---------------------------------------------------------------------
export interface InfosLivre {
  titre: string
  auteur: string
  couverture: string // adresse de l'image ; "" si aucune
}

interface ReponseOpenLibrary {
  docs?: { title?: string; author_name?: string[]; cover_i?: number }[]
}

// Premier résultat → titre, auteurs, couverture ; null si aucun.
// cover_i : couverture de l'ŒUVRE (toutes éditions confondues) ; elle existe
// souvent même quand l'édition précise (l'ISBN) n'a pas d'image.
export function lireReponseOpenLibrary(reponse: ReponseOpenLibrary): InfosLivre | null {
  const doc = reponse.docs?.[0]
  if (!doc) return null
  return {
    titre: doc.title ?? '',
    auteur: (doc.author_name ?? []).join(' et '),
    couverture: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
  }
}

// ---------------------------------------------------------------------
// Google Books (https://www.googleapis.com/books/v1/volumes), avec une clé
// d'API restreinte au site (voir data/couvertures.ts).
// ---------------------------------------------------------------------
interface ReponseGoogle {
  items?: {
    volumeInfo?: {
      title?: string
      authors?: string[]
      imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    }
  }[]
}

// Vignette Google Books : https (la page est en https) et sans l'effet
// « coin de page corné » (edge=curl).
export function nettoyerVignette(adresse: string): string {
  return adresse.replace(/^http:/, 'https:').replace(/&edge=curl/, '')
}

// Premier résultat → titre, auteurs, couverture ; null si aucun.
export function lireReponseGoogle(reponse: ReponseGoogle): InfosLivre | null {
  const infos = reponse.items?.[0]?.volumeInfo
  if (!infos) return null
  const vignette = infos.imageLinks?.thumbnail ?? infos.imageLinks?.smallThumbnail ?? ''
  return {
    titre: infos.title ?? '',
    auteur: (infos.authors ?? []).join(' et '),
    couverture: vignette ? nettoyerVignette(vignette) : '',
  }
}

// ---------------------------------------------------------------------
// Dernier recours pour la COUVERTURE : l'image d'Amazon, par le code du lien.
// Adresse non documentée par Amazon (elle peut cesser de fonctionner) ; elle
// renvoie une image de 1 × 1 pixel quand il n'y a pas de couverture.
// ---------------------------------------------------------------------
export function couvertureAmazon(asin: string): string {
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`
}

// Fusionne les résultats de plusieurs sources, la première ayant priorité ;
// chaque champ vide est complété par la source suivante.
export function fusionnerInfos(...sources: (InfosLivre | null)[]): InfosLivre | null {
  const trouvees = sources.filter((s): s is InfosLivre => s !== null)
  if (trouvees.length === 0) return null
  const premier = (champ: keyof InfosLivre) => trouvees.find((s) => s[champ])?.[champ] ?? ''
  return { titre: premier('titre'), auteur: premier('auteur'), couverture: premier('couverture') }
}
