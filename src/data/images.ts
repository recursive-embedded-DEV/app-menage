import { supabase } from './supabase'

// Le SEUL fichier qui sait où sont les photos des recettes : le compartiment
// public « images-recettes » de Supabase Storage (supabase/images-recettes.sql).

const COMPARTIMENT = 'images-recettes'

// Envoie une image (déjà réduite) et renvoie son adresse publique.
// Le nom contient l'heure : une nouvelle photo a toujours une NOUVELLE adresse,
// donc aucun cache (navigateur, service worker) ne peut montrer l'ancienne.
export async function televerserImageRecette(image: Blob, idRecette: string): Promise<string> {
  const extension = image.type === 'image/webp' ? 'webp' : 'jpg'
  const chemin = `${idRecette}-${Date.now()}.${extension}`
  const { error } = await supabase.storage.from(COMPARTIMENT).upload(chemin, image, { contentType: image.type })
  if (error) throw error
  return supabase.storage.from(COMPARTIMENT).getPublicUrl(chemin).data.publicUrl
}

// Supprime une image de Storage à partir de son adresse publique.
// Sans effet pour une image de public/img/ (recettes d'origine).
export async function supprimerImageRecette(adresse: string): Promise<void> {
  const repere = `/object/public/${COMPARTIMENT}/`
  const i = adresse.indexOf(repere)
  if (i < 0) return
  const { error } = await supabase.storage.from(COMPARTIMENT).remove([adresse.slice(i + repere.length)])
  if (error) throw error
}
