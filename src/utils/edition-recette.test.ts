import { describe, expect, it } from 'vitest'
import type { Aliment } from '../types/aliment'
import type { Recette } from '../types/recette'
import { brouillonVide, creerIdentifiant, lignesDeTexte, validerBrouillon, versBrouillon } from './edition-recette'

const riz: Aliment = {
  id: 42,
  source: 'fcen',
  nom: 'Riz blanc, cuit',
  groupe: '',
  kcal: 130,
  proteines_g: 2.7,
  glucides_g: 28,
  lipides_g: 0.3,
  mesures: [],
  legume_libre: false,
  auteur_id: null,
}

const recette: Recette = {
  id: 'pokebowl',
  titre: 'Pokebowl',
  image: 'poke.webp',
  temps: { preparation_min: 15, cuisson_min: 0, repos_min: 0 },
  rendement: '2 portions',
  portions: 2,
  ingredients: [
    {
      section: '',
      items: [
        { nom: 'Riz', quantite: '200 g', aliment: riz, aliment_id: 42, grammes: 200 },
        { nom: 'Coriandre', quantite: 'Au goût', aliment: null, aliment_id: null, grammes: null },
      ],
    },
  ],
  etapes: [{ section: '', items: ['Cuire le riz.', 'Assembler.'] }],
  notes: ['Bon froid.'],
}

describe('creerIdentifiant', () => {
  it.each([
    ['Pain aux bananes', 'pain-aux-bananes'],
    ['Bol façon bành mì', 'bol-facon-banh-mi'],
    ['  Œufs brouillés !! ', 'oeufs-brouilles'],
    ['!!!', ''],
  ])('%s → %s', (titre, attendu) => {
    expect(creerIdentifiant(titre)).toBe(attendu)
  })
})

describe('lignesDeTexte', () => {
  it('une par ligne, sans lignes vides ni espaces superflus', () => {
    expect(lignesDeTexte('  Cuire.\n\n Servir. \n')).toEqual(['Cuire.', 'Servir.'])
  })
})

describe('aller-retour recette → brouillon → recette', () => {
  it('retrouve les mêmes données', () => {
    const v = validerBrouillon(versBrouillon(recette), 'pokebowl')
    expect(v).toEqual({
      ok: true,
      recette: {
        id: 'pokebowl',
        titre: 'Pokebowl',
        image: 'poke.webp',
        preparation_min: 15,
        cuisson_min: 0,
        repos_min: 0,
        rendement: '2 portions',
        portions: 2,
        etapes: [{ section: '', items: ['Cuire le riz.', 'Assembler.'] }],
        notes: ['Bon froid.'],
        ingredients: [
          { section: '', nom: 'Riz', quantite: '200 g', aliment_id: 42, grammes: 200 },
          { section: '', nom: 'Coriandre', quantite: 'Au goût', aliment_id: null, grammes: null },
        ],
      },
    })
  })
})

describe('validerBrouillon', () => {
  const valide = () => {
    const b = brouillonVide()
    b.titre = 'Test'
    b.ingredients[0].lignes[0].nom = 'Farine'
    return b
  }

  it('brouillon minimal valide ; lignes vides ignorées ; portions avec virgule', () => {
    const b = valide()
    b.portions = '1,5'
    b.ingredients[0].lignes.push({ cle: 'x', nom: '  ', quantite: '', aliment: null, grammes: null })
    const v = validerBrouillon(b, 'test')
    expect(v.ok && v.recette.ingredients).toHaveLength(1)
    expect(v.ok && v.recette.portions).toBe(1.5)
  })

  it.each([
    ['sans titre', (b: ReturnType<typeof valide>) => (b.titre = ' '), 'titre'],
    ['temps décimal', (b: ReturnType<typeof valide>) => (b.cuisson = '12,5'), 'minutes'],
    ['portions nulles', (b: ReturnType<typeof valide>) => (b.portions = '0'), 'portions'],
    ['aucun ingrédient', (b: ReturnType<typeof valide>) => (b.ingredients[0].lignes[0].nom = ''), 'ingrédient'],
  ])('refuse : %s', (_, modifier, mot) => {
    const b = valide()
    modifier(b)
    const v = validerBrouillon(b, 'test')
    expect(v.ok).toBe(false)
    expect(!v.ok && v.erreur).toContain(mot)
  })
})
