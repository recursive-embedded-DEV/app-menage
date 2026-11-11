import { describe, expect, it } from 'vitest'
import { champCsv, construireAliments, ecrireCsv, estMesureEnGrammes, lireCsv, versLigneCsv } from './fcen.mjs'

describe('lireCsv', () => {
  it('retire le BOM et lit les champs entre guillemets', () => {
    const texte = '﻿Food_Code,Food_Description_FR\n4,"Chop suey, avec viande, conserve"\n'
    expect(lireCsv(texte)).toEqual([{ Food_Code: '4', Food_Description_FR: 'Chop suey, avec viande, conserve' }])
  })

  it('gère les guillemets doublés, les retours de ligne Windows et un champ sur deux lignes', () => {
    const texte = 'a,b\r\n"il a dit ""oui""","ligne 1\nligne 2"\r\n'
    expect(lireCsv(texte)).toEqual([{ a: 'il a dit "oui"', b: 'ligne 1\nligne 2' }])
  })
})

describe('écriture CSV', () => {
  it('met entre guillemets seulement si nécessaire', () => {
    expect(champCsv('Riz')).toBe('Riz')
    expect(champCsv('Riz, blanc')).toBe('"Riz, blanc"')
    expect(champCsv('[{"nom":"1 tasse"}]')).toBe('"[{""nom"":""1 tasse""}]"')
  })

  it('aller-retour : ce qui est écrit se relit à l\'identique', () => {
    const texte = ecrireCsv(['nom', 'mesures'], [['Riz, blanc', '[{"nom":"1 tasse","g":158}]']])
    expect(lireCsv(texte)).toEqual([{ nom: 'Riz, blanc', mesures: '[{"nom":"1 tasse","g":158}]' }])
  })
})

describe('estMesureEnGrammes', () => {
  it.each([
    ['50 g', true],
    ['100g', true],
    ['125 ml', false],
    ['1 oeuf moyen', false],
  ])('%s → %s', (nom, attendu) => {
    expect(estMesureEnGrammes(nom)).toBe(attendu)
  })
})

describe('construireAliments', () => {
  // Données réelles de l'oeuf cru (code 125), réduites.
  const entree = {
    noms: [
      { Food_Code: '125', Food_Description_FR: 'Oeuf, poule, entier, frais ou congelé, cru', CNF_Food_Group_Code: '1' },
      { Food_Code: '999', Food_Description_FR: 'Aliment incomplet', CNF_Food_Group_Code: '1' },
    ],
    groupes: new Map([['1', "Produits laitiers et d'oeufs"]]),
    teneurs: new Map([
      ['125', { kcal: 152, proteines_g: 12.268, glucides_g: 0.793, lipides_g: 10.608 }],
      ['999', { kcal: 100 }], // il manque 3 valeurs
    ]),
    mesures: new Map([
      [
        '125',
        [
          { codeMesure: 'a', g: 52.61 },
          { codeMesure: 'b', g: 50 }, // « 50 g » : retirée
          { codeMesure: 'a', g: 52.61 }, // doublon : retiré
        ],
      ],
    ]),
    nomsMesures: new Map([
      ['a', '1 oeufs large (gros)'],
      ['b', '50 g'],
    ]),
  }

  it('garde les 4 valeurs arrondies, le groupe et les mesures utiles', () => {
    expect(construireAliments(entree)).toEqual([
      {
        code_fcen: 125,
        nom: 'Oeuf, poule, entier, frais ou congelé, cru',
        groupe: "Produits laitiers et d'oeufs",
        kcal: 152,
        proteines_g: 12.27,
        glucides_g: 0.79,
        lipides_g: 10.61,
        mesures: [{ nom: '1 oeufs large (gros)', g: 52.6 }],
      },
    ])
  })

  it('produit une ligne CSV avec source « fcen » et les mesures en JSON', () => {
    const [aliment] = construireAliments(entree)
    expect(versLigneCsv(aliment)).toEqual([
      'fcen',
      125,
      'Oeuf, poule, entier, frais ou congelé, cru',
      "Produits laitiers et d'oeufs",
      152,
      12.27,
      0.79,
      10.61,
      '[{"nom":"1 oeufs large (gros)","g":52.6}]',
    ])
  })
})
