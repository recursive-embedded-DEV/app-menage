import { describe, expect, it } from 'vitest'
import {
  couvertureAmazon,
  estIsbn10,
  extraireAsin,
  fusionnerInfos,
  isbnDepuisLien,
  lireReponseGoogle,
  lireReponseOpenLibrary,
  nettoyerIsbn,
  nettoyerVignette,
} from './livres'

describe('extraireAsin', () => {
  it.each([
    ['https://www.amazon.ca/dp/0593653661', '0593653661'],
    ['https://www.amazon.ca/Hidden-Potential-Science-Achieving-Greater/dp/0593653661/ref=sr_1_1?crid=X', '0593653661'],
    ['https://www.amazon.com/gp/product/0735232482?psc=1', '0735232482'],
    ['https://www.amazon.ca/gp/aw/d/0735232482', '0735232482'], // mobile
    ['https://www.amazon.ca/exec/obidos/ASIN/0593653661/ref=x', '0593653661'],
    ['https://www.amazon.ca/s?k=livre&asin=0593653661&ref=x', '0593653661'],
    ['https://www.amazon.ca/dp/0593653661&tag=abc', '0593653661'],
    ['https://www.amazon.ca/dp/B0CHTQ8X5D', 'B0CHTQ8X5D'], // Kindle
    ['https://www.amazon.ca/dp/0593653661#avis', '0593653661'],
    ['https://www.amazon.ca/dp/05936536610', null], // 11 caractères : pas un code
    ['https://a.co/d/3xYz9Ab', null], // lien raccourci : pas de code
    ['', null],
  ])('%s → %s', (lien, attendu) => {
    expect(extraireAsin(lien)).toBe(attendu)
  })
})

describe('estIsbn10', () => {
  it.each([
    ['0593653661', true], // Hidden Potential
    ['0735232482', true], // Four Thousand Weeks
    ['080442957X', true], // X final = 10
    ['0593653662', false], // mauvais chiffre de contrôle
    ['B0CHTQ8X5D', false], // ASIN Kindle
    ['12345', false],
  ])('%s → %s', (code, attendu) => {
    expect(estIsbn10(code)).toBe(attendu)
  })
})

describe('isbnDepuisLien', () => {
  it('livre imprimé : ISBN ; Kindle ou lien raccourci : null', () => {
    expect(isbnDepuisLien('https://www.amazon.ca/dp/0593653661')).toBe('0593653661')
    expect(isbnDepuisLien('https://www.amazon.ca/dp/B0CHTQ8X5D')).toBeNull()
    expect(isbnDepuisLien('https://a.co/d/3xYz9Ab')).toBeNull()
  })
})

describe('nettoyerIsbn', () => {
  it('garde les chiffres et le X final', () => {
    expect(nettoyerIsbn('0-8044-2957-x')).toBe('080442957X')
    expect(nettoyerIsbn('978-0-593-65366-1')).toBe('9780593653661')
  })
})

describe('lireReponseOpenLibrary', () => {
  it('titre, auteurs joints, couverture de l’œuvre', () => {
    const reponse = { docs: [{ title: 'Hidden Potential', author_name: ['Adam Grant'], cover_i: 14445208 }] }
    expect(lireReponseOpenLibrary(reponse)).toEqual({
      titre: 'Hidden Potential',
      auteur: 'Adam Grant',
      couverture: 'https://covers.openlibrary.org/b/id/14445208-M.jpg',
    })
  })

  it('aucun résultat → null ; sans couverture → couverture vide', () => {
    expect(lireReponseOpenLibrary({ docs: [] })).toBeNull()
    expect(lireReponseOpenLibrary({ docs: [{ title: 'X', author_name: ['A', 'B'] }] })).toEqual({
      titre: 'X',
      auteur: 'A et B',
      couverture: '',
    })
  })
})

describe('Google Books', () => {
  it('nettoyerVignette : https, sans coin corné', () => {
    expect(nettoyerVignette('http://books.google.com/books/content?id=abc&zoom=1&edge=curl&source=gbs_api')).toBe(
      'https://books.google.com/books/content?id=abc&zoom=1&source=gbs_api',
    )
  })

  it('lireReponseGoogle : titre, auteurs joints, couverture ; aucun résultat → null', () => {
    const reponse = {
      items: [{ volumeInfo: { title: 'Science Under Siege', authors: ['Michael E. Mann', 'Peter J. Hotez'], imageLinks: { thumbnail: 'http://books.google.com/x&edge=curl' } } }],
    }
    expect(lireReponseGoogle(reponse)).toEqual({
      titre: 'Science Under Siege',
      auteur: 'Michael E. Mann et Peter J. Hotez',
      couverture: 'https://books.google.com/x',
    })
    expect(lireReponseGoogle({})).toBeNull()
  })
})

describe('fusionnerInfos', () => {
  it('la 1re source a priorité ; les champs vides sont complétés par les suivantes', () => {
    const google = { titre: 'Titre Google', auteur: '', couverture: '' }
    const openLibrary = { titre: 'Titre OL', auteur: 'Auteur OL', couverture: 'ol.jpg' }
    expect(fusionnerInfos(google, null, openLibrary)).toEqual({ titre: 'Titre Google', auteur: 'Auteur OL', couverture: 'ol.jpg' })
    expect(fusionnerInfos(null, null)).toBeNull()
  })

  it('couvertureAmazon : adresse par le code du livre', () => {
    expect(couvertureAmazon('1541705491')).toBe('https://images-na.ssl-images-amazon.com/images/P/1541705491.01.L.jpg')
  })
})
