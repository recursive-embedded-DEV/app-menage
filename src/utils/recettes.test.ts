import { describe, expect, it } from 'vitest'
import { grouperParSection } from './recettes'

describe('grouperParSection', () => {
  it('regroupe les lignes consécutives de même section, dans l\'ordre des positions', () => {
    const carottes = { section: '', position: 1, nom: 'Carottes' }
    const radis = { section: '', position: 2, nom: 'Radis' }
    const lime = { section: 'Pour la vinaigrette', position: 3, nom: 'Jus de lime' }
    const soya = { section: 'Pour la vinaigrette', position: 4, nom: 'Sauce soya' }
    expect(grouperParSection([lime, carottes, radis, soya])).toEqual([
      { section: '', items: [carottes, radis] },
      { section: 'Pour la vinaigrette', items: [lime, soya] },
    ])
  })

  it('aucune ligne : aucun groupe', () => {
    expect(grouperParSection([])).toEqual([])
  })
})
