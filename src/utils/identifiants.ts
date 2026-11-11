// Identifiants lisibles des adresses (#/recettes/pain-aux-bananes,
// #/listes/quincaillerie), créés à partir d'un titre. Sert aux recettes et aux listes.

// « Pain aux bananes ! » → « pain-aux-bananes » (« Quincaillerie » → « quincaillerie »).
export function creerIdentifiant(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/œ/gi, 'oe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Premier identifiant libre : « base » s'il n'est pas pris, sinon « base-2 », « base-3 »…
export function premierLibre(base: string, pris: Set<string>): string {
  if (!pris.has(base)) return base
  let n = 2
  while (pris.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}
