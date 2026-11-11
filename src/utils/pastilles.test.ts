import { describe, expect, it } from 'vitest'
import { etatPastille } from './pastilles'

// Objectif de 100 : la valeur est directement le pourcentage.
describe('etatPastille — minimum (protéines)', () => {
  it.each([
    [0, 'gris'],
    [49, 'gris'],
    [50, 'jaune'],
    [89, 'jaune'],
    [90, 'vert'],
    [150, 'vert'], // dépasser un minimum n'est pas un problème
  ])('%d %% → %s', (valeur, couleur) => {
    expect(etatPastille(valeur, 100, 'minimum')).toEqual({ pourcentage: valeur, couleur })
  })
})

describe('etatPastille — maximum (calories, glucides, lipides)', () => {
  it.each([
    [0, 'gris'],
    [1, 'vert'],
    [100, 'vert'],
    [101, 'orange'],
    [110, 'orange'],
    [111, 'rouge'],
  ])('%d %% → %s', (valeur, couleur) => {
    expect(etatPastille(valeur, 100, 'maximum')).toEqual({ pourcentage: valeur, couleur })
  })
})

describe('etatPastille — arrondi', () => {
  it('le pourcentage est arrondi avant d\'appliquer les seuils', () => {
    // 2 009 / 2 000 kcal = 100,45 % → 100 % → vert
    expect(etatPastille(2009, 2000, 'maximum')).toEqual({ pourcentage: 100, couleur: 'vert' })
    // 2 011 / 2 000 = 100,55 % → 101 % → orange
    expect(etatPastille(2011, 2000, 'maximum')).toEqual({ pourcentage: 101, couleur: 'orange' })
  })
})
