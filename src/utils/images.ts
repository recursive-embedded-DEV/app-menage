// Réduction d'une photo dans le navigateur, AVANT l'envoi vers Supabase Storage.
// Même règle que scripts/optimiser-images.mjs : 800 px de large au plus.
// Une photo de téléphone (3 à 8 Mo) devient un fichier d'environ 50 à 150 ko.

export const LARGEUR_MAX = 800
const QUALITE = 0.78

// Dimensions réduites en gardant les proportions ; jamais agrandies.
//   4032 × 3024 → 800 × 600 ; 600 × 400 → 600 × 400
export function dimensionsReduites(largeur: number, hauteur: number, max = LARGEUR_MAX) {
  if (largeur <= max) return { largeur, hauteur }
  return { largeur: max, hauteur: Math.round((hauteur * max) / largeur) }
}

// Fichier choisi (photo ou galerie) → image réduite, en WebP si le navigateur
// sait en produire, sinon en JPEG (Safari sur iPhone ne produit pas de WebP :
// il renverrait un PNG de plusieurs Mo).
export async function reduireImage(fichier: File): Promise<Blob> {
  // createImageBitmap décode l'image ; imageOrientation : respecte l'orientation
  // EXIF des photos de téléphone (sinon, certaines seraient couchées).
  const image = await createImageBitmap(fichier, { imageOrientation: 'from-image' })
  const { largeur, hauteur } = dimensionsReduites(image.width, image.height)

  const canevas = document.createElement('canvas')
  canevas.width = largeur
  canevas.height = hauteur
  const contexte = canevas.getContext('2d')
  if (!contexte) throw new Error('Canvas indisponible')
  contexte.drawImage(image, 0, 0, largeur, hauteur)
  image.close()

  const versBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canevas.toBlob(resolve, type, QUALITE))

  const webp = await versBlob('image/webp')
  // Un navigateur qui ne sait pas produire le format demandé renvoie un PNG.
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await versBlob('image/jpeg')
  if (!jpeg) throw new Error("L'image n'a pas pu être convertie")
  return jpeg
}

// Image d'une recette : nom de fichier de public/img/ (recettes d'origine) OU
// adresse complète dans Supabase Storage (photos ajoutées dans l'app).
export function estImageEnLigne(image: string): boolean {
  return /^https?:\/\//.test(image)
}
