import type { Aliment } from '../types/aliment'
import type { Groupe, Recette } from '../types/recette'
import { lireNombreSaisi } from './nutrition'

// Logique PURE du formulaire de recette (testée dans edition-recette.test.ts).
//
// Le formulaire travaille sur un « brouillon » : des champs texte, comme les
// tape l'utilisateur. On ne convertit (nombres, lignes) et ne valide qu'à
// l'enregistrement. `cle` identifie chaque ligne pour React (liste modifiable).

export interface LigneIngredient {
  cle: string
  nom: string
  quantite: string // texte affiché : « 2 tasses »
  aliment: Aliment | null // lien nutrition (facultatif)
  grammes: number | null // poids pour la recette de base (avec l'aliment)
}

export interface GroupeIngredients {
  cle: string
  section: string // "" = pas de sous-titre
  lignes: LigneIngredient[]
}

export interface GroupeEtapes {
  cle: string
  section: string
  texte: string // UNE étape par ligne
}

export interface Brouillon {
  titre: string
  image: string // conservée telle quelle (envoi de photo : étape R4)
  preparation: string
  cuisson: string
  repos: string
  rendement: string
  portions: string
  ingredients: GroupeIngredients[]
  etapes: GroupeEtapes[]
  notes: string // UNE note par ligne
}

// Ce qu'attend la fonction SQL enregistrer_recette().
export interface RecetteAEnregistrer {
  id: string
  titre: string
  image: string
  preparation_min: number
  cuisson_min: number
  repos_min: number
  rendement: string
  portions: number
  etapes: Groupe<string>[]
  notes: string[]
  ingredients: { section: string; nom: string; quantite: string; aliment_id: number | null; grammes: number | null }[]
}

const cle = () => crypto.randomUUID()

export function ligneVide(): LigneIngredient {
  return { cle: cle(), nom: '', quantite: '', aliment: null, grammes: null }
}

export function brouillonVide(): Brouillon {
  return {
    titre: '',
    image: '',
    preparation: '0',
    cuisson: '0',
    repos: '0',
    rendement: '',
    portions: '4',
    ingredients: [{ cle: cle(), section: '', lignes: [ligneVide()] }],
    etapes: [{ cle: cle(), section: '', texte: '' }],
    notes: '',
  }
}

// Recette existante → brouillon (modification).
export function versBrouillon(r: Recette): Brouillon {
  return {
    titre: r.titre,
    image: r.image,
    preparation: String(r.temps.preparation_min),
    cuisson: String(r.temps.cuisson_min),
    repos: String(r.temps.repos_min),
    rendement: r.rendement,
    portions: String(r.portions).replace('.', ','),
    ingredients: r.ingredients.map((g) => ({
      cle: cle(),
      section: g.section,
      lignes: g.items.map((i) => ({ cle: cle(), nom: i.nom, quantite: i.quantite, aliment: i.aliment, grammes: i.grammes })),
    })),
    etapes: r.etapes.map((g) => ({ cle: cle(), section: g.section, texte: g.items.join('\n') })),
    notes: r.notes.join('\n'),
  }
}

// Texte d'une zone « une par ligne » → liste, sans lignes vides.
export function lignesDeTexte(texte: string): string[] {
  return texte
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

// « Pain aux bananes ! » → « pain-aux-bananes » (identifiant de l'adresse).
export function creerIdentifiant(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/œ/gi, 'oe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type Validation = { ok: true; recette: RecetteAEnregistrer } | { ok: false; erreur: string }

// Brouillon → recette à enregistrer, ou le premier problème trouvé.
export function validerBrouillon(b: Brouillon, id: string): Validation {
  const titre = b.titre.trim()
  if (!titre) return { ok: false, erreur: 'Donne un titre à la recette.' }
  if (!id) return { ok: false, erreur: 'Le titre doit contenir au moins une lettre ou un chiffre.' }

  const minutes = (texte: string) => lireNombreSaisi(texte === '' ? '0' : texte)
  const temps = [minutes(b.preparation), minutes(b.cuisson), minutes(b.repos)]
  if (temps.some((t) => !Number.isInteger(t) || t < 0)) {
    return { ok: false, erreur: 'Les temps sont des nombres entiers de minutes (0 si l’étape n’existe pas).' }
  }

  const portions = lireNombreSaisi(b.portions)
  if (!(portions > 0)) return { ok: false, erreur: 'Le nombre de portions doit être plus grand que 0.' }

  // Lignes sans nom : ignorées (lignes laissées vides par l'utilisateur).
  const ingredients = b.ingredients.flatMap((g) =>
    g.lignes
      .filter((l) => l.nom.trim())
      .map((l) => ({
        section: g.section.trim(),
        nom: l.nom.trim(),
        quantite: l.quantite.trim(),
        aliment_id: l.aliment && l.grammes ? l.aliment.id : null,
        grammes: l.aliment && l.grammes ? l.grammes : null,
      })),
  )
  if (ingredients.length === 0) return { ok: false, erreur: 'Ajoute au moins un ingrédient.' }

  const etapes = b.etapes
    .map((g) => ({ section: g.section.trim(), items: lignesDeTexte(g.texte) }))
    .filter((g) => g.items.length > 0)

  return {
    ok: true,
    recette: {
      id,
      titre,
      image: b.image,
      preparation_min: temps[0],
      cuisson_min: temps[1],
      repos_min: temps[2],
      rendement: b.rendement.trim(),
      portions,
      etapes,
      notes: lignesDeTexte(b.notes),
      ingredients,
    },
  }
}
