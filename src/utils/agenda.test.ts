import { describe, expect, it } from 'vitest'
import { evenementsDuJour, lireEvenementGoogle, personnesDuJour, proposerReglages } from './agenda'

describe('lireEvenementGoogle', () => {
  it('événement à heure précise', () => {
    const e = lireEvenementGoogle(
      {
        id: 'a',
        summary: ' Dentiste ',
        location: 'Clinique',
        start: { dateTime: '2026-11-11T14:00:00-05:00' },
        end: { dateTime: '2026-11-11T15:00:00-05:00' },
        extendedProperties: { private: { recette: 'banh-mi' } },
      },
      'agenda-m',
      'mathieu',
    )
    expect(e).toMatchObject({ id: 'a', titre: 'Dentiste', lieu: 'Clinique', journeeEntiere: false, personne: 'mathieu' })
    expect(e?.debut.toISOString()).toBe('2026-11-11T19:00:00.000Z')
    expect(e?.liens).toEqual({ recette: 'banh-mi' })
  })

  it('journée entière : de minuit à minuit, heure du Québec', () => {
    const e = lireEvenementGoogle({ id: 'b', start: { date: '2026-11-11' }, end: { date: '2026-11-12' } }, 'x', 'famille')
    expect(e?.journeeEntiere).toBe(true)
    expect(e?.titre).toBe('(sans titre)')
    expect(e?.debut.toISOString()).toBe('2026-11-11T05:00:00.000Z')
    expect(e?.fin.toISOString()).toBe('2026-11-12T05:00:00.000Z')
  })

  it('annulé ou incomplet → null', () => {
    expect(lireEvenementGoogle({ id: 'c', status: 'cancelled', start: { date: '2026-11-11' }, end: { date: '2026-11-12' } }, 'x', 'mathieu')).toBeNull()
    expect(lireEvenementGoogle({ id: 'd' }, 'x', 'mathieu')).toBeNull()
  })
})

describe('evenementsDuJour et personnesDuJour', () => {
  const lire = (id: string, personne: 'mathieu' | 'mariana' | 'famille', debut: object, fin: object) =>
    lireEvenementGoogle({ id, start: debut, end: fin }, 'x', personne)!
  const evenements = [
    lire('soir', 'mariana', { dateTime: '2026-11-11T23:00:00-05:00' }, { dateTime: '2026-11-11T23:30:00-05:00' }),
    lire('matin', 'mathieu', { dateTime: '2026-11-11T06:30:00-05:00' }, { dateTime: '2026-11-11T07:30:00-05:00' }),
    lire('conge', 'famille', { date: '2026-11-10' }, { date: '2026-11-13' }), // 10, 11 et 12
    lire('demain', 'mathieu', { dateTime: '2026-11-12T09:00:00-05:00' }, { dateTime: '2026-11-12T10:00:00-05:00' }),
  ]

  it('journées entières d’abord, puis par heure ; un congé de 3 jours apparaît chaque jour', () => {
    expect(evenementsDuJour(evenements, '2026-11-11').map((e) => e.id)).toEqual(['conge', 'matin', 'soir'])
    expect(evenementsDuJour(evenements, '2026-11-12').map((e) => e.id)).toEqual(['conge', 'demain'])
    expect(evenementsDuJour(evenements, '2026-11-13')).toEqual([]) // fin exclusive
  })

  it('23 h 00 à 23 h 30 au Québec reste le même jour (04 h UTC le lendemain)', () => {
    expect(evenementsDuJour(evenements, '2026-11-11').some((e) => e.id === 'soir')).toBe(true)
  })

  it('personnesDuJour : dans l’ordre Mathieu, Mariana, Ménage', () => {
    expect(personnesDuJour(evenements, '2026-11-11')).toEqual(['mathieu', 'mariana', 'famille'])
    expect(personnesDuJour(evenements, '2026-11-14')).toEqual([])
  })
})

describe('proposerReglages', () => {
  const agendas = [
    { id: 'mathieu@gmail.com', nom: 'mathieu@gmail.com', principal: true },
    { id: 'mariana.x@gmail.com', nom: 'Mariana X', principal: false },
    { id: 'abc@group.calendar.google.com', nom: 'Famille', principal: false },
    { id: 'fr.canadian#holiday@group.v.calendar.google.com', nom: 'Jours fériés', principal: false },
  ]

  it('pour Mathieu : son principal, l’agenda de Mariana, Famille', () => {
    expect(proposerReglages(agendas, 'Mathieu')).toEqual({
      mathieu: 'mathieu@gmail.com',
      mariana: 'mariana.x@gmail.com',
      famille: 'abc@group.calendar.google.com',
    })
  })

  it('rien de reconnaissable : null', () => {
    expect(proposerReglages([{ id: 'p', nom: 'p', principal: true }], null)).toEqual({ mathieu: null, mariana: null, famille: null })
  })
})
