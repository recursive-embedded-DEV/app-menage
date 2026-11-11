// Ajustement des quantités d'une recette selon le nombre de portions.
//
// Les quantités de recettes.json sont du TEXTE LIBRE ("450 g", "1 1/4 c. à thé",
// "Au goût"…). Plutôt que de restructurer les 9 recettes, on lit les nombres
// dans le texte, on les multiplie, et on réécrit le texte. Le résultat est
// CALCULÉ à l'affichage, jamais stocké (convention du projet).
//
// Ce qui est ajusté :
//   - le nombre au DÉBUT du texte, ou l'intervalle « 1/2 à 1 » ;
//   - une équivalence entre parenthèses qui commence par ≈ : « (≈ 2 c. à soupe) ».
// Ce qui ne l'est PAS :
//   - les autres nombres, ex. « 1 conserve de 546 mL (19 oz) » : 546 mL et 19 oz
//     décrivent la taille de la conserve, pas la quantité ;
//   - un texte sans nombre au début (« Au goût », « Pour badigeonner »).

// Un nombre tel qu'écrit dans les recettes : mixte (1 1/4), fraction (1/2),
// entier ou décimal (2,5). L'ordre compte : la regex essaie la forme la plus longue d'abord.
const NOMBRE = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?`

// Le mot qui suit le nombre, pour l'accorder (« 2 tasses », « 1 tasse »).
// Mot complet seulement : « c. à thé » est exclu grâce au point (abréviation).
const MOT = String.raw`(\s+[a-zA-ZÀ-ÿ]+(?=$|[\s)]))?`

// Groupes : (1) préfixe conservé tel quel, (2) premier nombre, (3) 2e borne
// facultative, (4) mot qui suit, facultatif.
const AU_DEBUT = new RegExp(`^()(${NOMBRE})(?:\\s+à\\s+(${NOMBRE}))?${MOT}`)
const EQUIVALENCE = new RegExp(`(\\(≈\\s*)(${NOMBRE})(?:\\s+à\\s+(${NOMBRE}))?${MOT}`)

// Unités métriques : affichées en décimal (« 3,8 mL »). Les autres (tasse,
// c. à thé, nombre d'aliments…) le sont en fractions de cuisine (« 1 1/2 tasse »).
const UNITE_METRIQUE = /^\s*(kg|g|ml|l)\b/i

// Fractions qu'on trouve sur des tasses et des cuillères à mesurer.
const FRACTIONS: [number, string][] = [
  [0, ''], [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'], [1 / 2, '1/2'],
  [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'], [1, ''],
]

// "1 1/4" → 1.25 ; "1/2" → 0.5 ; "2,5" → 2.5
export function lireNombre(texte: string): number {
  const t = texte.trim().replace(',', '.')
  const mixte = t.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixte) return Number(mixte[1]) + Number(mixte[2]) / Number(mixte[3])
  const fraction = t.match(/^(\d+)\/(\d+)$/)
  if (fraction) return Number(fraction[1]) / Number(fraction[2])
  return Number(t)
}

// 3.75 → "3,8" ; 37.5 → "38" (au-delà de 10, la décimale n'apporte rien en cuisine)
export function formaterDecimal(valeur: number): string {
  const arrondi = valeur >= 10 ? Math.round(valeur) : Math.round(valeur * 10) / 10
  return String(arrondi).replace('.', ',')
}

// 1.875 → "1 7/8" ; 0.75 → "3/4" ; 2 → "2"
export function formaterFraction(valeur: number): string {
  let entier = Math.floor(valeur)
  const reste = valeur - entier

  // La fraction de cuisine la plus proche du reste.
  const [proche, texte] = FRACTIONS.reduce((meilleure, f) =>
    Math.abs(f[0] - reste) < Math.abs(meilleure[0] - reste) ? f : meilleure,
  )
  if (proche === 1) entier += 1 // ex. 1,95 → 2 plutôt que « 1 1 »

  // Une quantité réduite ne doit jamais s'afficher « 0 ».
  if (entier === 0 && texte === '') return '1/8'

  return [entier > 0 ? String(entier) : '', proche === 1 ? '' : texte].filter(Boolean).join(' ')
}

// Règle du français : pluriel à partir de 2 (« 1 1/2 tasse », « 2 tasses »).
// `mot` commence par l'espace qui le sépare du nombre.
function accorder(mot: string, valeur: number): string {
  if (UNITE_METRIQUE.test(mot)) return mot // « 2 kg », jamais « 2 kgs »
  if (valeur >= 2) return /[sx]$/.test(mot) ? mot : `${mot}s`
  return mot.endsWith('s') ? mot.slice(0, -1) : mot
}

function remplacer(texte: string, motif: RegExp, facteur: number): string {
  return texte.replace(
    motif,
    (complet, prefixe: string, premier: string, second: string | undefined, mot: string | undefined, position: number) => {
      // L'unité est ce qui suit le nombre (ou l'intervalle) : elle décide du format.
      const suite = (mot ?? '') + texte.slice(position + complet.length)
      const formater = UNITE_METRIQUE.test(suite) ? formaterDecimal : formaterFraction
      const ajuster = (n: string) => formater(lireNombre(n) * facteur)

      // Dans un intervalle, c'est la plus grande borne qui décide de l'accord.
      const plusGrande = lireNombre(second ?? premier) * facteur
      return (
        prefixe +
        ajuster(premier) +
        (second ? ` à ${ajuster(second)}` : '') +
        (mot ? accorder(mot, plusGrande) : '')
      )
    },
  )
}

// Point d'entrée : "1/2 à 1 tasse", ×1,5 → "3/4 à 1 1/2 tasse"
export function ajusterQuantite(texte: string, facteur: number): string {
  // Facteur 1 : on rend le texte d'origine tel quel (aucune reformulation).
  if (facteur === 1) return texte
  return remplacer(remplacer(texte, AU_DEBUT, facteur), EQUIVALENCE, facteur)
}

// Vrai si la quantité contient un nombre (« 450 g »), faux pour « Au goût ».
// Sert à pré-cocher les ingrédients à ajouter à l'épicerie.
export function aUneQuantite(quantite: string): boolean {
  return /\d/.test(quantite)
}

// Texte de l'article dans la liste d'épicerie :
//   "Dinde, hachée (675 g)" ; "Sel et poivre" (pas de quantité chiffrée)
export function texteArticle(nom: string, quantite: string, facteur: number): string {
  return aUneQuantite(quantite) ? `${nom} (${ajusterQuantite(quantite, facteur)})` : nom
}
