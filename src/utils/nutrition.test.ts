import { describe, expect, it } from 'vitest'
import {
  formaterValeur,
  grammesDe,
  lireNombreSaisi,
  lireQuantiteTexte,
  quantiteTexte,
  repasParDefaut,
  textePortions,
  totaux,
  totauxJournal,
  valeurRecette,
  valeursEntree,
  valeursPour,
  versPour100,
} from './nutrition'

// Oeuf cru, FCEN code 125 : valeurs pour 100 g.
const oeuf = { kcal: 152, proteines_g: 12.27, glucides_g: 0.79, lipides_g: 10.61 }

describe('valeursPour', () => {
  it('1 oeuf moyen (45,6 g)', () => {
    const v = valeursPour(oeuf, 45.6)
    expect(v.kcal).toBeCloseTo(69.31, 2)
    expect(v.proteines_g).toBeCloseTo(5.6, 2)
  })

  it('100 g : valeurs identiques ; 0 g : tout à zéro', () => {
    expect(valeursPour(oeuf, 100)).toEqual(oeuf)
    expect(valeursPour(oeuf, 0)).toEqual({ kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 })
  })
})

describe('totaux', () => {
  it('additionne les valeurs de chaque entrée selon ses grammes', () => {
    const riz = { kcal: 130, proteines_g: 2.7, glucides_g: 28, lipides_g: 0.3 }
    const t = totaux([
      { aliment: oeuf, grammes: 100 }, // 152 kcal
      { aliment: riz, grammes: 200 }, // 260 kcal
    ])
    expect(t.kcal).toBeCloseTo(412, 5)
    expect(t.proteines_g).toBeCloseTo(17.67, 5)
  })

  it('journée vide : tout à zéro', () => {
    expect(totaux([])).toEqual({ kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 })
  })
})

describe('repasParDefaut', () => {
  it.each([
    [6, 'dejeuner'],
    [10, 'dejeuner'],
    [11, 'diner'],
    [14, 'diner'],
    [15, 'collation'],
    [17, 'souper'],
    [20, 'souper'],
    [21, 'collation'],
    [0, 'dejeuner'],
  ])('%d h → %s', (heure, attendu) => {
    expect(repasParDefaut(heure)).toBe(attendu)
  })
})

describe('versPour100', () => {
  it('tableau « par portion de 85 g » → pour 100 g, arrondi au centième', () => {
    const parPortion = { kcal: 300, proteines_g: 13, glucides_g: 55, lipides_g: 1.5 }
    expect(versPour100(parPortion, 85)).toEqual({ kcal: 352.94, proteines_g: 15.29, glucides_g: 64.71, lipides_g: 1.76 })
  })

  it('refuse une portion de 0 g', () => {
    expect(() => versPour100(oeuf, 0)).toThrow()
  })
})

describe('formaterValeur', () => {
  it('kcal entières, grammes à une décimale, virgule décimale', () => {
    expect(formaterValeur(69.31, 'kcal')).toBe('69')
    expect(formaterValeur(5.58, 'proteines_g')).toBe('5,6')
    expect(formaterValeur(12, 'lipides_g')).toBe('12')
  })
})

describe('lireNombreSaisi', () => {
  it.each([
    ['2,5', 2.5],
    ['85', 85],
    [' 0.4 ', 0.4],
  ])('%s → %d', (texte, attendu) => {
    expect(lireNombreSaisi(texte)).toBe(attendu)
  })

  it('texte vide ou non numérique → NaN', () => {
    expect(lireNombreSaisi('')).toBeNaN()
    expect(lireNombreSaisi('abc')).toBeNaN()
  })
})

describe('quantités du journal', () => {
  const moyen = { nom: '1 oeuf moyen', g: 45.6 }

  it('grammesDe : mesures × poids, ou grammes tels quels', () => {
    expect(grammesDe(2, { type: 'mesure', mesure: moyen })).toBeCloseTo(91.2, 5)
    expect(grammesDe(150, { type: 'g' })).toBe(150)
  })

  it('quantiteTexte : virgule décimale', () => {
    expect(quantiteTexte(2, { type: 'mesure', mesure: moyen })).toBe('2 × 1 oeuf moyen')
    expect(quantiteTexte(1.5, { type: 'mesure', mesure: moyen })).toBe('1,5 × 1 oeuf moyen')
    expect(quantiteTexte(150, { type: 'g' })).toBe('150 g')
  })

  it('lireQuantiteTexte : retrouve la mesure, sinon les grammes', () => {
    expect(lireQuantiteTexte('1,5 × 1 oeuf moyen', [moyen], 68.4)).toEqual({
      nombre: 1.5,
      unite: { type: 'mesure', mesure: moyen },
    })
    expect(lireQuantiteTexte('150 g', [moyen], 150)).toEqual({ nombre: 150, unite: { type: 'g' } })
    // Mesure disparue de l'aliment : on se rabat sur les grammes enregistrés.
    expect(lireQuantiteTexte('2 × 1 tasse', [moyen], 316)).toEqual({ nombre: 316, unite: { type: 'g' } })
  })
})

describe('légumes libres', () => {
  const carotte = { kcal: 41, proteines_g: 0.93, glucides_g: 9.58, lipides_g: 0.24, legume_libre: true }

  it('totaux : un légume libre ne compte pas', () => {
    const t = totaux([
      { aliment: oeuf, grammes: 100 },
      { aliment: carotte, grammes: 500 },
    ])
    expect(t.kcal).toBeCloseTo(152, 5)
  })
})

describe('valeurRecette', () => {
  const riz = { kcal: 130, proteines_g: 2.7, glucides_g: 28, lipides_g: 0.3, legume_libre: false }
  const carotte = { kcal: 41, proteines_g: 0.93, glucides_g: 9.58, lipides_g: 0.24, legume_libre: true }
  const recette = {
    portions: 2,
    ingredients: [
      {
        items: [
          { nom: 'Riz', fcen: 1, grammes: 200 }, // 260 kcal
          { nom: 'Carottes', fcen: 2, grammes: 122 }, // légume libre
          { nom: 'Sel et poivre' }, // pas d'aliment
          { nom: 'Ingrédient disparu', fcen: 99, grammes: 50 }, // code introuvable
        ],
      },
    ],
  }
  const aliments = new Map([
    [1, riz],
    [2, carotte],
  ])

  it('total et valeurs par portion, légumes et exclus séparés', () => {
    const v = valeurRecette(recette, aliments)
    expect(v.total.kcal).toBeCloseTo(260, 5)
    expect(v.parPortion.kcal).toBeCloseTo(130, 5)
    expect(v.parPortion.proteines_g).toBeCloseTo(2.7, 5)
    expect(v.legumes).toEqual(['Carottes'])
    expect(v.exclus).toEqual(['Sel et poivre', 'Ingrédient disparu'])
  })
})

describe('journal avec recettes', () => {
  const carotte = { kcal: 41, proteines_g: 0.93, glucides_g: 9.58, lipides_g: 0.24, legume_libre: true }
  const parPortion = new Map([['macaroni', { kcal: 466, proteines_g: 37, glucides_g: 50, lipides_g: 10 }]])

  it('valeursEntree : recette = valeurs par portion × portions', () => {
    const v = valeursEntree({ type: 'recette', recette_id: 'macaroni', portions: 1.5 }, parPortion)
    expect(v.kcal).toBeCloseTo(699, 5)
    expect(v.proteines_g).toBeCloseTo(55.5, 5)
  })

  it('valeursEntree : recette pas encore chargée → zéro', () => {
    expect(valeursEntree({ type: 'recette', recette_id: 'inconnue', portions: 2 }, parPortion).kcal).toBe(0)
  })

  it('totauxJournal : aliments + recettes, légumes libres exclus', () => {
    const t = totauxJournal(
      [
        { type: 'aliment', aliment: oeuf, grammes: 100 }, // 152
        { type: 'aliment', aliment: carotte, grammes: 300 }, // libre
        { type: 'recette', recette_id: 'macaroni', portions: 1 }, // 466
      ],
      parPortion,
    )
    expect(t.kcal).toBeCloseTo(618, 5)
  })

  it('textePortions : virgule et pluriel à partir de 2', () => {
    expect(textePortions(1)).toBe('1 portion')
    expect(textePortions(1.5)).toBe('1,5 portion')
    expect(textePortions(2)).toBe('2 portions')
  })
})
