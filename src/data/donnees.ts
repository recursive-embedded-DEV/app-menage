import type { Aliment } from '../types/aliment'
import type { Groupe, Recette, ResumeRecette } from '../types/recette'
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
