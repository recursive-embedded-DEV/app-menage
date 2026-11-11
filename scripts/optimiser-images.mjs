// Convertit des images en WebP allégé, pour les recettes.
//
// Utilisation :
//   node scripts/optimiser-images.mjs public/img/ma-recette.png [autres fichiers…]
//
// Pour chaque fichier, crée à côté un .webp :
//   - largeur maximale de 800 px (les images de recette s'affichent au plus
//     à 400 px de large ; 800 px reste net sur un écran Retina ×2) ;
//   - qualité 78 : bon compromis, sans artefacts visibles sur une photo.
// L'original n'est PAS supprimé : à faire soi-même après vérification,
// puis mettre à jour le champ "image" de la recette dans src/data/recettes.json.
import sharp from 'sharp'
import { stat } from 'node:fs/promises'

const LARGEUR_MAX = 800
const QUALITE = 78

const fichiers = process.argv.slice(2)
if (fichiers.length === 0) {
  console.error('Indique au moins un fichier. Ex. : node scripts/optimiser-images.mjs public/img/photo.png')
  process.exit(1)
}

const ko = (octets) => `${Math.round(octets / 1024)} ko`
let totalAvant = 0
let totalApres = 0

for (const source of fichiers) {
  const destination = source.replace(/\.(png|jpe?g)$/i, '.webp')
  if (destination === source) {
    console.warn(`Ignoré (ni PNG ni JPG) : ${source}`)
    continue
  }

  // withoutEnlargement : une image déjà petite n'est jamais agrandie.
  const info = await sharp(source)
    .resize({ width: LARGEUR_MAX, withoutEnlargement: true })
    .webp({ quality: QUALITE })
    .toFile(destination)

  const avant = (await stat(source)).size
  totalAvant += avant
  totalApres += info.size
  console.log(`${source} → ${destination}  ${ko(avant)} → ${ko(info.size)}  (${info.width}×${info.height})`)
}

console.log(`Total : ${ko(totalAvant)} → ${ko(totalApres)}`)
