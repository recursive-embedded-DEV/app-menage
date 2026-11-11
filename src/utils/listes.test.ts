import { describe, expect, it } from 'vitest'
import type { Livre } from '../types/liste'
import { categoriesDe, grouperLivres } from './listes'

const livre = (titre: string, categorie: string): Livre => ({
  id: titre,
  titre,
  auteur: '',
  lien: '',
  isbn: '',
  image: '',
  categorie,
})

describe('grouperLivres', () => {
  it('catégories par ordre alphabétique (accents compris), « Autres » à la fin', () => {
    const groupes = grouperLivres([
      livre('A', ''),
      livre('B', 'Leadership'),
      livre('C', 'Économie'),
      livre('D', 'Leadership'),
      livre('E', 'Finances'),
    ])
    expect(groupes.map((g) => g.categorie)).toEqual(['Économie', 'Finances', 'Leadership', 'Autres'])
    expect(groupes[2].livres.map((l) => l.titre)).toEqual(['B', 'D']) // ordre d'ajout gardé
  })

  it('espaces autour de la catégorie ignorés', () => {
    expect(grouperLivres([livre('A', ' Finances '), livre('B', 'Finances')])).toHaveLength(1)
  })
})

describe('categoriesDe', () => {
  it('sans doublons (majuscules), sans vide, triées', () => {
    expect(categoriesDe([livre('A', 'leadership'), livre('B', 'Leadership'), livre('C', ''), livre('D', 'Finances')])).toEqual([
      'Finances',
      'leadership',
    ])
  })
})
