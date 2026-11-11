import { describe, expect, it } from 'vitest'
import {
  dateLocale,
  debutJour,
  debutSemaine,
  decalageFuseau,
  decalerJours,
  estDateValide,
  formaterDateLongue,
  heureCourte,
  heureLocale,
  jourCourt,
  joursSemaine,
  libelleSemaine,
} from './dates'

describe('dateLocale', () => {
  it('23 h 30 au Québec (04 h 30 le lendemain en UTC) reste le même jour', () => {
    // 12 novembre 2026, 04 h 30 UTC = 11 novembre, 23 h 30 à Montréal (UTC−5)
    expect(dateLocale(new Date('2026-11-12T04:30:00Z'))).toBe('2026-11-11')
  })

  it('en été (heure avancée, UTC−4)', () => {
    expect(dateLocale(new Date('2026-07-02T03:59:00Z'))).toBe('2026-07-01')
    expect(dateLocale(new Date('2026-07-02T04:00:00Z'))).toBe('2026-07-02')
  })
})

describe('heureLocale', () => {
  it('donne l\'heure de Montréal, de 0 à 23', () => {
    expect(heureLocale(new Date('2026-11-12T04:30:00Z'))).toBe(23)
    expect(heureLocale(new Date('2026-11-12T05:00:00Z'))).toBe(0)
  })
})

describe('decalerJours', () => {
  it.each([
    ['2026-11-11', 1, '2026-11-12'],
    ['2026-11-11', -1, '2026-11-10'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'], // année bissextile
    ['2026-03-08', 1, '2026-03-09'], // passage à l'heure avancée : aucun effet
  ])('%s %+d → %s', (date, jours, attendu) => {
    expect(decalerJours(date, jours)).toBe(attendu)
  })
})

describe('estDateValide', () => {
  it.each([
    ['2026-11-11', true],
    ['2026-02-30', false],
    ['11-11-2026', false],
    ['abc', false],
  ])('%s → %s', (date, attendu) => {
    expect(estDateValide(date)).toBe(attendu)
  })
})

describe('formaterDateLongue', () => {
  it('jour de la semaine et mois en français, majuscule initiale', () => {
    expect(formaterDateLongue('2026-11-11', '2026-11-11')).toBe('Mercredi 11 novembre')
  })

  it('ajoute l\'année si elle diffère de l\'année en cours', () => {
    expect(formaterDateLongue('2025-12-31', '2026-01-01')).toBe('Mercredi 31 décembre 2025')
  })
})

describe('agenda : fuseau et semaine', () => {
  it('decalageFuseau : −300 min en hiver, −240 en été', () => {
    expect(decalageFuseau(new Date('2026-11-11T12:00:00Z'))).toBe(-300)
    expect(decalageFuseau(new Date('2026-07-01T12:00:00Z'))).toBe(-240)
  })

  it('debutJour : minuit à Montréal, en UTC', () => {
    expect(debutJour('2026-11-11').toISOString()).toBe('2026-11-11T05:00:00.000Z')
    expect(debutJour('2026-07-01').toISOString()).toBe('2026-07-01T04:00:00.000Z')
    // Jour du passage à l'heure avancée (8 mars 2026) : minuit est encore à UTC−5.
    expect(debutJour('2026-03-08').toISOString()).toBe('2026-03-08T05:00:00.000Z')
    expect(debutJour('2026-03-09').toISOString()).toBe('2026-03-09T04:00:00.000Z')
  })

  it('debutSemaine et joursSemaine : du lundi au dimanche', () => {
    expect(debutSemaine('2026-11-11')).toBe('2026-11-09') // mercredi → lundi 9
    expect(debutSemaine('2026-11-09')).toBe('2026-11-09') // lundi
    expect(debutSemaine('2026-11-15')).toBe('2026-11-09') // dimanche → lundi précédent
    expect(joursSemaine('2026-11-11')).toEqual([
      '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
    ])
  })

  it.each([
    ['2026-11-11', '9 au 15 novembre 2026'],
    ['2026-12-02', '30 novembre au 6 décembre 2026'],
    ['2026-12-30', '28 décembre 2026 au 3 janvier 2027'],
  ])('libelleSemaine(%s) → %s', (date, attendu) => {
    expect(libelleSemaine(date)).toBe(attendu)
  })

  it('jourCourt et heureCourte', () => {
    expect(jourCourt('2026-11-11')).toEqual({ nom: 'mer', numero: 11 })
    expect(heureCourte(new Date('2026-11-11T11:30:00Z'))).toBe('6 h 30') // 6 h 30 à Montréal
    expect(heureCourte(new Date('2026-11-11T19:00:00Z'))).toBe('14 h')
  })
})
