import { describe, expect, it } from 'vitest'
import {
  formaterValeur,
  grammesDe,
  lireNombreSaisi,
  lireQuantiteTexte,
  quantiteTexte,
  repasParDefaut,
  totaux,
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
