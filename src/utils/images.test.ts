import { describe, expect, it } from 'vitest'
import { dimensionsReduites, estImageEnLigne } from './images'

describe('dimensionsReduites', () => {
  it.each([
    [4032, 3024, 800, 600], // photo d'iPhone, paysage
    [3024, 4032, 800, 1067], // portrait
    [600, 400, 600, 400], // déjà petite : jamais agrandie
    [800, 500, 800, 500], // pile la limite
  ])('%d × %d → %d × %d', (l, h, attenduL, attenduH) => {
    expect(dimensionsReduites(l, h)).toEqual({ largeur: attenduL, hauteur: attenduH })
  })
})

describe('estImageEnLigne', () => {
  it('distingue un fichier de public/img/ d’une adresse Supabase Storage', () => {
    expect(estImageEnLigne('banh-mi.webp')).toBe(false)
    expect(estImageEnLigne('https://abc.supabase.co/storage/v1/object/public/images-recettes/x.webp')).toBe(true)
    expect(estImageEnLigne('')).toBe(false)
  })
})
