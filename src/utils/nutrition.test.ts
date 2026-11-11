import { describe, expect, it } from 'vitest'
import { formaterValeur, lireNombreSaisi, valeursPour, versPour100 } from './nutrition'

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
