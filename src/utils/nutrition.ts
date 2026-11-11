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
// Les LÉGUMES LIBRES ne comptent pas (règle décidée avec Mathieu).
export function totaux(entrees: { aliment: Valeurs & { legume_libre?: boolean }; grammes: number }[]): Valeurs {
  const zero: Valeurs = { kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 }
  return entrees.reduce((somme, { aliment, grammes }) => {
    if (aliment.legume_libre) return somme
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

// ---------------------------------------------------------------------
// Valeur nutritive d'une recette : à partir des ingrédients reliés à un aliment
// (aliment + grammes pour la recette de base, joints par Supabase).
// ---------------------------------------------------------------------
export interface ValeurRecette {
  total: Valeurs // recette de base complète
  parPortion: Valeurs // total ÷ portions de base
  legumes: string[] // ingrédients libres (légumes) : non comptés
  exclus: string[] // sans aliment (« au goût », eau…) : non comptés
}

// Ce dont le calcul a besoin : la forme la plus simple, pour servir à la fois
// à la page de recette et aux recettes jointes dans le journal.
export interface IngredientNutrition {
  nom: string
  aliment: (Valeurs & { legume_libre?: boolean }) | null
  grammes: number | null
}

export interface RecetteNutrition {
  portions: number
  ingredients: IngredientNutrition[]
}

export function valeurRecette(recette: RecetteNutrition): ValeurRecette {
  const comptes: { aliment: Valeurs; grammes: number }[] = []
  const legumes: string[] = []
  const exclus: string[] = []

  for (const ing of recette.ingredients) {
    if (!ing.aliment || !ing.grammes) exclus.push(ing.nom)
    else if (ing.aliment.legume_libre) legumes.push(ing.nom)
    else comptes.push({ aliment: ing.aliment, grammes: ing.grammes })
  }

  const total = totaux(comptes)
  const diviser = (n: number) => n / recette.portions
  return {
    total,
    parPortion: {
      kcal: diviser(total.kcal),
      proteines_g: diviser(total.proteines_g),
      glucides_g: diviser(total.glucides_g),
      lipides_g: diviser(total.lipides_g),
    },
    legumes,
    exclus,
  }
}

// ---------------------------------------------------------------------
// Journal avec recettes : une entrée est un aliment OU une recette.
// ---------------------------------------------------------------------
const ZERO: Valeurs = { kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 }

type EntreeCalculable =
  | { type: 'aliment'; aliment: Valeurs & { legume_libre?: boolean }; grammes: number }
  | { type: 'recette'; portions: number; recette: RecetteNutrition | null }

// Valeurs d'une entrée. Pour une recette : valeurs PAR PORTION (valeurRecette,
// légumes libres exclus) × nombre de portions. Recette disparue : zéro.
export function valeursEntree(e: EntreeCalculable): Valeurs {
  if (e.type === 'aliment') return totaux([e])
  if (!e.recette) return ZERO
  const v = valeurRecette(e.recette).parPortion
  return {
    kcal: v.kcal * e.portions,
    proteines_g: v.proteines_g * e.portions,
    glucides_g: v.glucides_g * e.portions,
    lipides_g: v.lipides_g * e.portions,
  }
}

// Total de plusieurs entrées du journal (un repas, une journée).
export function totauxJournal(entrees: EntreeCalculable[]): Valeurs {
  return entrees.reduce((somme, e) => {
    const v = valeursEntree(e)
    return {
      kcal: somme.kcal + v.kcal,
      proteines_g: somme.proteines_g + v.proteines_g,
      glucides_g: somme.glucides_g + v.glucides_g,
      lipides_g: somme.lipides_g + v.lipides_g,
    }
  }, ZERO)
}

// « 1 portion », « 1,5 portion », « 2 portions » (pluriel à partir de 2).
export function textePortions(portions: number): string {
  return `${formaterNombre(portions)} portion${portions >= 2 ? 's' : ''}`
}
