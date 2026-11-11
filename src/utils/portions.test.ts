import { describe, expect, it } from 'vitest'
import { ajusterQuantite, aUneQuantite, formaterFraction, lireNombre, texteArticle } from './portions'

// Les cas viennent des vraies quantités de src/data/recettes.json.
// Lancer : npm test   (ou npx vitest pour relancer à chaque modification)

describe('lireNombre', () => {
  it.each([
    ['2', 2],
    ['1/2', 0.5],
    ['1 1/4', 1.25],
    ['2,5', 2.5],
  ])('%s → %d', (texte, attendu) => {
    expect(lireNombre(texte)).toBe(attendu)
  })
})

describe('formaterFraction', () => {
  it.each([
    [2, '2'],
    [0.75, '3/4'],
    [1.875, '1 7/8'],
    [0.333, '1/3'],
    [1.97, '2'], // arrondi à l'entier suivant, pas « 1 1 »
    [0.01, '1/8'], // jamais « 0 »
  ])('%d → %s', (valeur, attendu) => {
    expect(formaterFraction(valeur)).toBe(attendu)
  })
})

describe('ajusterQuantite', () => {
  // ×1,5 : de 4 à 6 portions
  it.each([
    ['450 g', '675 g'],
    ['1/2 tasse', '3/4 tasse'],
    ['1 1/4 c. à thé', '1 7/8 c. à thé'],
    ['2,5 mL', '3,8 mL'],
    ['1/2 à 1 tasse', '3/4 à 1 1/2 tasse'],
    ['25 g (≈ 2 c. à soupe)', '38 g (≈ 3 c. à soupe)'],
    ['1 conserve de 546 mL (19 oz)', '1 1/2 conserve de 546 mL (19 oz)'],
    ['3', '4 1/2'],
    ['1 kg', '1,5 kg'],
  ])('×1,5 : %s → %s', (texte, attendu) => {
    expect(ajusterQuantite(texte, 1.5)).toBe(attendu)
  })

  // ×0,5 : de 4 à 2 portions
  it.each([
    ['450 g', '225 g'],
    ['1/3 tasse', '1/8 tasse'], // 1/6 → fraction de cuisine la plus proche
    ['3 c. à soupe', '1 1/2 c. à soupe'],
  ])('×0,5 : %s → %s', (texte, attendu) => {
    expect(ajusterQuantite(texte, 0.5)).toBe(attendu)
  })

  // Accord : pluriel à partir de 2 ; abréviations et unités métriques intactes.
  it.each([
    ['2 tasses', 0.5, '1 tasse'],
    ['1 tasse', 2, '2 tasses'],
    ['1 boîte', 2, '2 boîtes'],
    ['2 portions', 0.5, '1 portion'],
    ['1 conserve de 546 mL (19 oz)', 2, '2 conserves de 546 mL (19 oz)'],
    ['1/2 à 1 tasse', 2, '1 à 2 tasses'],
    ['1 c. à soupe', 2, '2 c. à soupe'],
    ['1 kg', 2, '2 kg'],
  ])('accord : %s ×%d → %s', (texte, facteur, attendu) => {
    expect(ajusterQuantite(texte, facteur)).toBe(attendu)
  })

  it.each(['Au goût', 'Pour badigeonner', 'À compléter'])('sans nombre, inchangé : %s', (texte) => {
    expect(ajusterQuantite(texte, 2)).toBe(texte)
  })

  it('facteur 1 : texte d\'origine intact (aucune reformulation)', () => {
    expect(ajusterQuantite('2,5 mL', 1)).toBe('2,5 mL')
  })
})

describe('texteArticle', () => {
  it('ajoute la quantité ajustée entre parenthèses', () => {
    expect(texteArticle('Dinde, hachée', '450 g', 1.5)).toBe('Dinde, hachée (675 g)')
  })

  it('garde seulement le nom sans quantité chiffrée', () => {
    expect(texteArticle('Sel et poivre', 'Au goût', 1.5)).toBe('Sel et poivre')
  })
})

describe('aUneQuantite', () => {
  it('distingue « 450 g » de « Au goût »', () => {
    expect(aUneQuantite('450 g')).toBe(true)
    expect(aUneQuantite('Au goût')).toBe(false)
  })
})
