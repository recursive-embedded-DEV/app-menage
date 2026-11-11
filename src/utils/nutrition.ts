import type { Mesure, Valeurs } from '../types/aliment'
import type { Repas } from '../types/journal'

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

// Somme des valeurs de plusieurs aliments consommés (le total d'un repas ou
// d'une journée). Calculée à chaque affichage, jamais stockée.
export function totaux(entrees: { aliment: Valeurs; grammes: number }[]): Valeurs {
  const zero: Valeurs = { kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 }
  return entrees.reduce((somme, { aliment, grammes }) => {
    const v = valeursPour(aliment, grammes)
    return {
      kcal: somme.kcal + v.kcal,
      proteines_g: somme.proteines_g + v.proteines_g,
      glucides_g: somme.glucides_g + v.glucides_g,
      lipides_g: somme.lipides_g + v.lipides_g,
    }
  }, zero)
}

export const REPAS: { cle: Repas; libelle: string }[] = [
  { cle: 'dejeuner', libelle: 'Déjeuner' },
  { cle: 'diner', libelle: 'Dîner' },
  { cle: 'souper', libelle: 'Souper' },
  { cle: 'collation', libelle: 'Collations' },
]

// Repas proposé selon l'heure locale (modifiable dans la boîte d'ajout) :
// avant 11 h déjeuner ; 11 h à 15 h dîner ; 17 h à 21 h souper ; sinon collation.
export function repasParDefaut(heure: number): Repas {
  if (heure < 11) return 'dejeuner'
  if (heure < 15) return 'diner'
  if (heure >= 17 && heure < 21) return 'souper'
  return 'collation'
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

// ---------------------------------------------------------------------
// Quantité saisie dans le journal : un nombre de mesures (« 2 × 1 oeuf moyen »)
// ou des grammes (« 150 g »). On stocke les grammes ET ce texte.
// ---------------------------------------------------------------------
export type Unite = { type: 'g' } | { type: 'mesure'; mesure: Mesure }

export function grammesDe(nombre: number, unite: Unite): number {
  return unite.type === 'g' ? nombre : nombre * unite.mesure.g
}

// 2 → « 2 » ; 1.5 → « 1,5 »
const formaterNombre = (n: number) => n.toLocaleString('fr-CA', { maximumFractionDigits: 2 })

export function quantiteTexte(nombre: number, unite: Unite): string {
  return unite.type === 'g' ? `${formaterNombre(nombre)} g` : `${formaterNombre(nombre)} × ${unite.mesure.nom}`
}

// L'inverse, pour préremplir la modification d'une entrée.
// La mesure est retrouvée par son nom parmi celles de l'aliment ;
// si elle a disparu (aliment perso modifié), on se rabat sur les grammes.
export function lireQuantiteTexte(
  texte: string,
  mesures: Mesure[],
  grammes: number,
): { nombre: number; unite: Unite } {
  const enMesures = texte.match(/^([\d\s,.]+) × (.+)$/)
  if (enMesures) {
    const mesure = mesures.find((m) => m.nom === enMesures[2])
    const nombre = lireNombreSaisi(enMesures[1].replace(/\s/g, ''))
    if (mesure && nombre > 0) return { nombre, unite: { type: 'mesure', mesure } }
  }
  return { nombre: grammes, unite: { type: 'g' } }
}

// Libellés courts des 4 valeurs.
const LIBELLES_COURTS: Record<keyof Valeurs, string> = {
  kcal: 'kcal',
  proteines_g: 'prot.',
  glucides_g: 'gluc.',
  lipides_g: 'lip.',
}

// « 69 kcal · 5,6 g prot. · 0,4 g gluc. · 4,8 g lip. »
export function resumeValeurs(v: Valeurs): string {
  return CLES_VALEURS.map((cle) =>
    cle === 'kcal' ? `${formaterValeur(v.kcal, 'kcal')} kcal` : `${formaterValeur(v[cle], cle)} g ${LIBELLES_COURTS[cle]}`,
  ).join(' · ')
}
