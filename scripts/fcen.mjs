// Fonctions pures de conversion du Fichier canadien sur les éléments nutritifs
// (FCEN 2026, Santé Canada, Licence du gouvernement ouvert – Canada).
// Utilisées par scripts/convertir-fcen.mjs et testées par scripts/fcen.test.mjs.

// Codes des éléments nutritifs dans Nutrient_Name.csv (valeurs pour 100 g).
export const NUTRIMENTS = {
  208: 'kcal', // Énergie (kilocalories)
  203: 'proteines_g', // Protéines
  205: 'glucides_g', // Glucides totaux (par différence)
  204: 'lipides_g', // Lipides totaux
}

// Dans Measure_Weight_Conversion.csv, le type 6 (« Défini par l'utilisateur »)
// donne le poids d'une mesure de cuisine. Les types 3 (portion non comestible)
// et 9 (rendement) ne nous servent pas.
export const TYPE_MESURE_CUISINE = '6'

// Lecteur CSV (RFC 4180) : virgules, champs entre guillemets, "" pour un
// guillemet, retours de ligne dans un champ. Générateur : une ligne à la fois,
// pour ne pas créer 565 000 objets d'un coup avec Nutrient_Amount.csv.
export function* lignesCsv(texte) {
  texte = texte.replace(/^﻿/, '') // marque BOM des fichiers UTF-8 du FCEN
  let ligne = []
  let champ = ''
  let entreGuillemets = false

  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]
    if (entreGuillemets) {
      if (c === '"' && texte[i + 1] === '"') {
        champ += '"'
        i++
      } else if (c === '"') {
        entreGuillemets = false
      } else {
        champ += c
      }
    } else if (c === '"') {
      entreGuillemets = true
    } else if (c === ',') {
      ligne.push(champ)
      champ = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++
      ligne.push(champ)
      yield ligne
      ligne = []
      champ = ''
    } else {
      champ += c
    }
  }
  // Dernière ligne sans retour final.
  if (champ !== '' || ligne.length > 0) {
    ligne.push(champ)
    yield ligne
  }
}

// Petits fichiers : tableau d'objets { en-tête: valeur }.
export function lireCsv(texte) {
  const [entetes, ...lignes] = [...lignesCsv(texte)]
  return lignes
    .filter((l) => !(l.length === 1 && l[0] === '')) // lignes vides
    .map((l) => Object.fromEntries(entetes.map((e, k) => [e, l[k] ?? ''])))
}

// Un champ CSV n'est mis entre guillemets que s'il le faut.
export function champCsv(valeur) {
  const texte = String(valeur)
  return /[",\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte
}

export function ecrireCsv(entetes, lignes) {
  return [entetes, ...lignes].map((l) => l.map(champCsv).join(',')).join('\n') + '\n'
}

export const arrondir = (nombre, decimales) => {
  const facteur = 10 ** decimales
  return Math.round(nombre * facteur) / facteur
}

// « 50 g », « 100g » : redondant, puisqu'on peut toujours saisir des grammes.
export function estMesureEnGrammes(nom) {
  return /^\d+(?:[.,]\d+)?\s*g$/i.test(nom.trim())
}

// Assemble les aliments à partir des fichiers déjà lus.
//   noms          : lignes de Food_Name.csv
//   groupes       : Map code de groupe → nom du groupe en français
//   teneurs       : Map code d'aliment → { kcal, proteines_g, glucides_g, lipides_g }
//   mesures       : Map code d'aliment → [{ codeMesure, g }]
//   nomsMesures   : Map code de mesure → nom en français
export function construireAliments({ noms, groupes, teneurs, mesures, nomsMesures }) {
  const aliments = []
  for (const n of noms) {
    const code = n.Food_Code
    const valeurs = teneurs.get(code)
    // Un aliment sans ses 4 valeurs ne servirait à rien dans le journal.
    if (!valeurs || Object.values(NUTRIMENTS).some((cle) => valeurs[cle] === undefined)) continue

    // Mesures de cuisine : nom en français, sans doublons ni mesures « en grammes ».
    const vues = new Set()
    const mesuresAliment = []
    for (const { codeMesure, g } of mesures.get(code) ?? []) {
      const nom = nomsMesures.get(codeMesure)
      if (!nom || estMesureEnGrammes(nom) || vues.has(nom) || !(g > 0)) continue
      vues.add(nom)
      mesuresAliment.push({ nom, g: arrondir(g, 1) })
    }

    aliments.push({
      code_fcen: Number(code),
      nom: n.Food_Description_FR || n.Food_Description_EN,
      groupe: groupes.get(n.CNF_Food_Group_Code) ?? '',
      kcal: arrondir(valeurs.kcal, 0),
      proteines_g: arrondir(valeurs.proteines_g, 2),
      glucides_g: arrondir(valeurs.glucides_g, 2),
      lipides_g: arrondir(valeurs.lipides_g, 2),
      mesures: mesuresAliment,
    })
  }
  return aliments
}

// Colonnes du CSV importé dans la table public.aliments (même ordre, mêmes noms).
export const COLONNES = ['source', 'code_fcen', 'nom', 'groupe', 'kcal', 'proteines_g', 'glucides_g', 'lipides_g', 'mesures']

export function versLigneCsv(aliment) {
  return [
    'fcen',
    aliment.code_fcen,
    aliment.nom,
    aliment.groupe,
    aliment.kcal,
    aliment.proteines_g,
    aliment.glucides_g,
    aliment.lipides_g,
    JSON.stringify(aliment.mesures), // colonne jsonb
  ]
}
