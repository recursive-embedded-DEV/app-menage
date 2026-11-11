import type { Aliment } from '../types/aliment'
import type { Groupe, Recette, ResumeRecette } from '../types/recette'
import type { RecetteAEnregistrer } from '../utils/edition-recette'
import { grouperParSection } from '../utils/recettes'
import { COLONNES_ALIMENT } from './aliments'
import { supabase } from './supabase'

// Le SEUL fichier qui sait où sont les recettes : les tables recettes et
// ingredients_recette de Supabase (lecture publique, écriture par les membres).
// Avant : src/data/recettes.json. Les composants n'ont presque pas changé,
// puisqu'ils reçoivent toujours le même type Recette.

const COLONNES_RESUME = 'id, titre, image, preparation_min, cuisson_min, repos_min, rendement'

// Recette complète : ses ingrédients imbriqués, et l'aliment de chacun.
// Pour un visiteur non connecté, la RLS de la table aliments renvoie null.
const COLONNES_RECETTE = `${COLONNES_RESUME}, portions, etapes, notes,
  ingredients:ingredients_recette(section, position, nom, quantite, aliment_id, grammes, aliment:aliments(${COLONNES_ALIMENT}))`

interface LigneResume {
  id: string
  titre: string
  image: string
  preparation_min: number
  cuisson_min: number
  repos_min: number
  rendement: string
}

interface LigneRecette extends LigneResume {
  portions: number
  etapes: Groupe<string>[]
  notes: string[]
  ingredients: {
    section: string
    position: number
    nom: string
    quantite: string
    aliment_id: number | null
    grammes: number | null
    aliment: Aliment | null
  }[]
}

function versResume(l: LigneResume): ResumeRecette {
  return {
    id: l.id,
    titre: l.titre,
    image: l.image,
    temps: { preparation_min: l.preparation_min, cuisson_min: l.cuisson_min, repos_min: l.repos_min },
    rendement: l.rendement,
  }
}

function versRecette(l: LigneRecette): Recette {
  return {
    ...versResume(l),
    portions: Number(l.portions),
    // Lignes ordonnées → groupes { section, items } (comme l'ancien JSON).
    ingredients: grouperParSection(
      l.ingredients.map((i) => ({ ...i, grammes: i.grammes === null ? null : Number(i.grammes) })),
    ),
    etapes: l.etapes,
    notes: l.notes,
  }
}

// Liste des recettes, par ordre alphabétique.
export async function chargerRecettes(): Promise<ResumeRecette[]> {
  const { data, error } = await supabase.from('recettes').select(COLONNES_RESUME).order('titre')
  if (error) throw error
  return (data as LigneResume[]).map(versResume)
}

// Une recette complète ; undefined si elle n'existe pas.
export async function chargerRecette(id: string): Promise<Recette | undefined> {
  const { data, error } = await supabase.from('recettes').select(COLONNES_RECETTE).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? versRecette(data as unknown as LigneRecette) : undefined
}

// ---------------------------------------------------------------------
// Écriture (membres du ménage seulement : règles RLS).
// ---------------------------------------------------------------------

// Erreur précise : la recette est dans un journal (clé étrangère RESTRICT).
export class RecetteUtilisee extends Error {}

// Recette + ingrédients en UNE transaction (fonction SQL enregistrer_recette) :
// tout est enregistré, ou rien. Renvoie l'identifiant de la recette.
export async function enregistrerRecette(recette: RecetteAEnregistrer): Promise<string> {
  const { data, error } = await supabase.rpc('enregistrer_recette', { recette })
  if (error) throw error
  return data as string
}

// Pour une NOUVELLE recette : « pain-aux-bananes » s'il est libre, sinon
// « pain-aux-bananes-2 », « -3 »… La fonction SQL fait un « upsert » : sans
// cette vérification, une nouvelle recette du même titre REMPLACERAIT l'autre.
export async function identifiantLibre(base: string): Promise<string> {
  const { data, error } = await supabase.from('recettes').select('id').like('id', `${base}%`)
  if (error) throw error
  const pris = new Set((data as { id: string }[]).map((r) => r.id))
  if (!pris.has(base)) return base
  let n = 2
  while (pris.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export async function supprimerRecette(id: string): Promise<void> {
  // .select('id') : vérifie qu'une ligne a vraiment été supprimée (RLS
  // refuserait sans erreur). Les ingrédients suivent (on delete cascade).
  const { data, error } = await supabase.from('recettes').delete().eq('id', id).select('id')
  if (error?.code === '23503') throw new RecetteUtilisee() // dans un journal
  if (error) throw error
  if (!data || data.length === 0) throw new Error("La recette n'a pas pu être supprimée.")
}
