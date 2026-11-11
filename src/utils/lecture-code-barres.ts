// Lecture d'un code-barres de livre (EAN-13 = ISBN-13) avec la bibliothèque
// ZXing, chargée SEULEMENT au besoin (import() dynamique : fichier séparé, exclu
// du pré-cache de la PWA).

// Réglages communs : seulement l'EAN-13 (plus rapide, moins d'erreurs) et
// TRY_HARDER (plus lent, mais tolère mieux une image un peu floue ou petite).
export async function creerLecteur() {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ])
  const indices = new Map<number, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]],
    [DecodeHintType.TRY_HARDER, true],
  ])
  return new BrowserMultiFormatReader(indices)
}

// Largeur maximale de la photo analysée : une photo d'iPhone (4032 px) est
// longue à analyser ; 2000 px gardent un code-barres lisible.
const LARGEUR_ANALYSE = 2000

// Code-barres lu dans une PHOTO (appareil photo natif : mise au point et macro
// gérées par le téléphone). Renvoie le texte du code, ou null s'il est illisible.
// EN RÉSERVE : le bouton « 📸 Photo du code-barres » est désactivé (mis en
// commentaires dans DialogueLivre.tsx, passages « PHOTO ») ; le scan en direct suffit.
export async function lireCodeBarresDansPhoto(fichier: File): Promise<string | null> {
  const lecteur = await creerLecteur()
  // imageOrientation : respecte l'orientation EXIF (photo prise à la verticale).
  const image = await createImageBitmap(fichier, { imageOrientation: 'from-image' })
  const echelle = Math.min(1, LARGEUR_ANALYSE / image.width)
  const canevas = document.createElement('canvas')
  canevas.width = Math.round(image.width * echelle)
  canevas.height = Math.round(image.height * echelle)
  canevas.getContext('2d')?.drawImage(image, 0, 0, canevas.width, canevas.height)
  image.close()
  try {
    return lecteur.decodeFromCanvas(canevas).getText()
  } catch {
    return null // ZXing lance une erreur quand il ne trouve aucun code
  }
}

// Après le démarrage de la caméra : mise au point continue et zoom ×2 si
// l'appareil les propose (souvent sur Android ; Safari ne les expose pas
// toujours). Le zoom grossit le code-barres SANS rapprocher le livre, donc à
// une distance où l'image reste nette. Sans effet si non pris en charge.
export function ameliorerCamera(video: HTMLVideoElement): void {
  const piste = (video.srcObject as MediaStream | null)?.getVideoTracks()[0]
  if (!piste?.getCapabilities) return
  // focusMode et zoom ne sont pas encore dans les types standards de TypeScript.
  const capacites = piste.getCapabilities() as MediaTrackCapabilities & {
    focusMode?: string[]
    zoom?: { min: number; max: number }
  }
  const reglages: Record<string, unknown>[] = []
  if (capacites.focusMode?.includes('continuous')) reglages.push({ focusMode: 'continuous' })
  if (capacites.zoom && capacites.zoom.max >= 1.5) reglages.push({ zoom: Math.min(2, capacites.zoom.max) })
  if (reglages.length > 0) piste.applyConstraints({ advanced: reglages as MediaTrackConstraintSet[] }).catch(() => {})
}
