import type { Valeurs } from '../types/aliment'

// Calculs nutritionnels purs (sans réseau), testés dans nutrition.test.ts.

export const CLES_VALEURS = ['kcal', 'proteines_g', 'glucides_g', 'lipides_g'] as const

// Applique la même opération aux 4 valeurs.
function transformer(valeurs: Valeurs, operation: (n: number) => number): Valeurs {
  return {
    kcal: operation(valeurs.kcal),
    proteines_g: operation(valeurs.proteines_g),
    glucides_g: operation(valeurs.glucides_g),
    lipides_g: operation(valeurs.lipides_g),
  }
}

// Valeurs d'une quantité, à partir des valeurs pour 100 g.
// Ex. oeuf (152 kcal / 100 g), 1 oeuf moyen de 45,6 g → 69,3 kcal.
export function valeursPour(pour100: Valeurs, grammes: number): Valeurs {
  return transformer(pour100, (n) => (n * grammes) / 100)
}

// L'inverse : un tableau de valeurs nutritives donne souvent les valeurs
// « par portion de 85 g » ; la base les garde « pour 100 g ».
export function versPour100(parPortion: Valeurs, grammesPortion: number): Valeurs {
  if (!(grammesPortion > 0)) throw new Error('La portion doit peser plus de 0 g')
  return transformer(parPortion, (n) => Math.round(((n * 100) / grammesPortion) * 100) / 100)
}

// Affichage : kcal entières, grammes à une décimale, virgule décimale.
//   formaterValeur(69.31, 'kcal') → "69" ; formaterValeur(5.58, 'proteines_g') → "5,6"
export function formaterValeur(n: number, cle: keyof Valeurs): string {
  const decimales = cle === 'kcal' ? 0 : 1
  return n.toLocaleString('fr-CA', { maximumFractionDigits: decimales, minimumFractionDigits: 0 })
}

// Lecture d'un nombre saisi au clavier : accepte la virgule (« 2,5 »).
// Renvoie NaN si le texte n'est pas un nombre.
export function lireNombreSaisi(texte: string): number {
  const propre = texte.trim().replace(',', '.')
  return propre === '' ? NaN : Number(propre)
}
