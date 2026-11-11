// Convertit les fichiers bruts du FCEN 2026 en UN fichier CSV prêt à importer
// dans la table public.aliments (Supabase → Table Editor → Import data from CSV).
//
// Utilisation :
//   node scripts/convertir-fcen.mjs donnees-fcen/brut donnees-fcen/aliments-fcen.csv
//
// Source : Fichier canadien sur les éléments nutritifs, Santé Canada, 2026.
// Licence du gouvernement ouvert – Canada (citer la source).
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  COLONNES,
  NUTRIMENTS,
  TYPE_MESURE_CUISINE,
  construireAliments,
  ecrireCsv,
  lignesCsv,
  lireCsv,
  versLigneCsv,
} from './fcen.mjs'

const [dossier, sortie] = process.argv.slice(2)
if (!dossier || !sortie) {
  console.error('Utilisation : node scripts/convertir-fcen.mjs <dossier des CSV du FCEN> <fichier de sortie.csv>')
  process.exit(1)
}

const lire = (fichier) => readFile(join(dossier, fichier), 'utf8')

// Petits fichiers : lus en entier.
const noms = lireCsv(await lire('Food_Name.csv'))
const groupes = new Map(
  lireCsv(await lire('CNF_Food_Group.csv')).map((g) => [g.CNF_Food_Group_Code, g.CNF_Food_Group_Description_FR]),
)
const nomsMesures = new Map(
  lireCsv(await lire('Measure_Name.csv')).map((m) => [m.Measure_Code, m.Measure_Description_and_Unit_FR]),
)

// Gros fichier (565 000 lignes) : parcouru ligne par ligne, on ne garde que
// les 4 éléments nutritifs utiles. Colonnes : Food_Code, Nutrient_Code, Nutrient_Amount, …
const teneurs = new Map()
let premiere = true
for (const [code, codeNutriment, quantite] of lignesCsv(await lire('Nutrient_Amount.csv'))) {
  if (premiere) {
    premiere = false // en-têtes
    continue
  }
  const cle = NUTRIMENTS[codeNutriment]
  if (!cle) continue
  if (!teneurs.has(code)) teneurs.set(code, {})
  teneurs.get(code)[cle] = Number(quantite)
}

// Colonnes : Food_Code, Measure_Type_Code, Measure_Code, Measure_Weight_Conversion, …
const mesures = new Map()
premiere = true
for (const [code, type, codeMesure, poids] of lignesCsv(await lire('Measure_Weight_Conversion.csv'))) {
  if (premiere) {
    premiere = false
    continue
  }
  if (type !== TYPE_MESURE_CUISINE) continue
  if (!mesures.has(code)) mesures.set(code, [])
  mesures.get(code).push({ codeMesure, g: Number(poids) })
}

const aliments = construireAliments({ noms, groupes, teneurs, mesures, nomsMesures })
await writeFile(sortie, ecrireCsv(COLONNES, aliments.map(versLigneCsv)), 'utf8')

const avecMesures = aliments.filter((a) => a.mesures.length > 0).length
console.log(`${aliments.length} aliments écrits dans ${sortie} (${avecMesures} avec des mesures de cuisine).`)
