import type { ProfilNutrition } from '../types/journal'
import { idUtilisateur } from './auth'
import { supabase } from './supabase'

// Le SEUL fichier qui sait où est le profil nutrition : public.profils_nutrition.
// Une ligne par membre, privée (RLS).

const COLONNES = 'actif, objectif_kcal, objectif_proteines_g, objectif_glucides_g, objectif_lipides_g'

interface LigneProfil {
  actif: boolean
  objectif_kcal: number | null
  objectif_proteines_g: number | null
  objectif_glucides_g: number | null
  objectif_lipides_g: number | null
}

// Profil d'un membre qui n'a encore rien enregistré.
export const PROFIL_VIDE: ProfilNutrition = {
  actif: false,
  objectifs: { kcal: null, proteines_g: null, glucides_g: null, lipides_g: null },
}

export async function chargerProfil(): Promise<ProfilNutrition> {
  // maybeSingle : 0 ligne n'est pas une erreur (membre sans profil).
  const { data, error } = await supabase.from('profils_nutrition').select(COLONNES).maybeSingle()
  if (error) throw error
  if (!data) return PROFIL_VIDE
  const l = data as LigneProfil
  return {
    actif: l.actif,
    objectifs: {
      kcal: l.objectif_kcal,
      proteines_g: l.objectif_proteines_g,
      glucides_g: l.objectif_glucides_g,
      lipides_g: l.objectif_lipides_g,
    },
  }
}

// « Upsert » : crée la ligne la première fois, la met à jour ensuite.
// user_id sert à détecter le conflit ; RLS vérifie que c'est bien le nôtre.
export async function enregistrerProfil(profil: ProfilNutrition): Promise<void> {
  const ligne = {
    user_id: await idUtilisateur(),
    actif: profil.actif,
    objectif_kcal: profil.objectifs.kcal,
    objectif_proteines_g: profil.objectifs.proteines_g,
    objectif_glucides_g: profil.objectifs.glucides_g,
    objectif_lipides_g: profil.objectifs.lipides_g,
  }
  const { error } = await supabase.from('profils_nutrition').upsert(ligne, { onConflict: 'user_id' })
  if (error) throw error
}
