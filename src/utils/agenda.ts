import type { Evenement, Personne } from '../types/agenda'
import { PERSONNES } from '../types/agenda'
import { debutJour, decalerJours } from './dates'

// Logique PURE de l'agenda (testée dans agenda.test.ts).

// Couleurs des personnes (maquette « Agenda M&M ») : bleu et orange se
// distinguent aussi pour une personne daltonienne ; le vert, par sa clarté.
export const COULEURS: Record<Personne, string> = {
  mathieu: '#2F6FB3',
  mariana: '#C25E00',
  famille: '#1E7A3C',
}

export const NOMS: Record<Personne, string> = {
  mathieu: 'Mathieu',
  mariana: 'Mariana',
  famille: 'Ménage',
}

// Forme (partielle) d'un événement renvoyé par l'API Google Calendar.
export interface EvenementGoogle {
  id: string
  status?: string
  summary?: string
  location?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
  extendedProperties?: { private?: Record<string, string> }
}

// Événement brut de Google → notre type. null pour un événement annulé ou
// incomplet. Journée entière : Google donne une DATE (« 2026-11-11 ») ;
// sinon une heure précise avec fuseau (« 2026-11-11T14:00:00-05:00 »).
export function lireEvenementGoogle(brut: EvenementGoogle, agendaId: string, personne: Personne): Evenement | null {
  if (brut.status === 'cancelled' || !brut.start || !brut.end) return null
  const journeeEntiere = Boolean(brut.start.date)
  const debut = journeeEntiere ? debutJour(brut.start.date!) : new Date(brut.start.dateTime ?? '')
  const fin = journeeEntiere ? debutJour(brut.end.date!) : new Date(brut.end.dateTime ?? '')
  if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) return null
  return {
    id: brut.id,
    agendaId,
    personne,
    titre: brut.summary?.trim() || '(sans titre)',
    debut,
    fin,
    journeeEntiere,
    lieu: brut.location ?? '',
    liens: brut.extendedProperties?.private ?? {},
  }
}

// Événements d'une journée locale (AAAA-MM-JJ) : tout événement qui CHEVAUCHE
// cette journée (un congé de 3 jours apparaît les 3 jours). Journées entières
// d'abord, puis par heure de début.
export function evenementsDuJour(evenements: Evenement[], date: string): Evenement[] {
  const debut = debutJour(date).getTime()
  const fin = debutJour(decalerJours(date, 1)).getTime()
  return evenements
    .filter((e) => e.debut.getTime() < fin && e.fin.getTime() > debut)
    .sort((a, b) => Number(b.journeeEntiere) - Number(a.journeeEntiere) || a.debut.getTime() - b.debut.getTime())
}

// Pour la bande de la semaine : qui a au moins un événement ce jour-là
// (dans l'ordre Mathieu, Mariana, Ménage).
export function personnesDuJour(evenements: Evenement[], date: string): Personne[] {
  const presentes = new Set(evenementsDuJour(evenements, date).map((e) => e.personne))
  return PERSONNES.filter((p) => presentes.has(p))
}

// Réglages proposés au premier usage (le membre confirme ou corrige) :
//   - SON prénom → son agenda principal ;
//   - l'AUTRE personne → un agenda dont le nom ou l'adresse contient son prénom ;
//   - Ménage → un agenda dont le nom contient « famille ».
export function proposerReglages(
  agendas: { id: string; nom: string; principal: boolean }[],
  prenom: string | null,
): Record<Personne, string | null> {
  const sansAccents = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const contient = (mot: string) => agendas.find((a) => !a.principal && sansAccents(`${a.nom} ${a.id}`).includes(mot))?.id ?? null
  const principal = agendas.find((a) => a.principal)?.id ?? null
  const moi = prenom ? sansAccents(prenom) : ''
  return {
    mathieu: moi === 'mathieu' ? principal : contient('mathieu'),
    mariana: moi === 'mariana' ? principal : contient('mariana'),
    famille: contient('famille'),
  }
}

// ---------------------------------------------------------------------
// Création et modification (G3) : formulaire ↔ événement Google.
// ---------------------------------------------------------------------

// Liens vers les modules, rangés dans extendedProperties.private de
// l'événement Google. "" = aucun lien.
export interface LiensEvenement {
  recette: string // identifiant d'une recette (ex. « banh-mi »)
  liste: string // identifiant d'une liste (ex. « epicerie »)
}

// Ce que contient le formulaire (des textes, comme les tape l'utilisateur).
export interface ChampsEvenement {
  titre: string
  date: string // AAAA-MM-JJ
  journeeEntiere: boolean
  debut: string // « 18:00 » (input type="time")
  fin: string // « 19:00 »
  lieu: string
  liens: LiensEvenement
}

// « 18:00 » + 60 min → « 19:00 » ; plafonné à 23:59 (pas de passage au lendemain).
export function ajouterMinutes(heure: string, minutes: number): string {
  const [h, m] = heure.split(':').map(Number)
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Premier problème du formulaire, ou null s'il est valide.
export function validerChamps(c: ChampsEvenement): string | null {
  if (!c.titre.trim()) return 'Donne un titre à l’événement.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date)) return 'Choisis une date.'
  if (!c.journeeEntiere) {
    if (!/^\d{2}:\d{2}$/.test(c.debut) || !/^\d{2}:\d{2}$/.test(c.fin)) return 'Indique l’heure de début et de fin.'
    if (c.fin <= c.debut) return 'La fin doit suivre le début.' // « HH:MM » se compare comme du texte
  }
  return null
}

// Formulaire → corps d'une requête à Google (création ou modification).
//   - journée entière : des DATES, la fin étant EXCLUSIVE (le lendemain) ;
//   - sinon : heures LOCALES + timeZone : c'est Google qui applique l'heure
//     avancée, aucun écart calculé ici.
//   - les deux liens sont TOUJOURS envoyés ("" = aucun) : une modification
//     partielle (PATCH) fusionne ces propriétés, elle n'effacerait pas un
//     ancien lien absent du corps.
export function versEvenementGoogle(c: ChampsEvenement) {
  const moment = (heure: string) => ({ dateTime: `${c.date}T${heure}:00`, timeZone: 'America/Toronto' })
  return {
    summary: c.titre.trim(),
    location: c.lieu.trim(),
    start: c.journeeEntiere ? { date: c.date } : moment(c.debut),
    end: c.journeeEntiere ? { date: decalerJours(c.date, 1) } : moment(c.fin),
    extendedProperties: { private: { recette: c.liens.recette, liste: c.liens.liste } },
  }
}

// Heure locale « HH:MM » d'un instant (pour préremplir un input type="time").
function heureFormulaire(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(instant)
}

// Événement existant → formulaire prérempli (modification).
export function versChamps(e: Evenement): ChampsEvenement {
  const dateDebut = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(e.debut)
  return {
    titre: e.titre,
    date: dateDebut,
    journeeEntiere: e.journeeEntiere,
    debut: e.journeeEntiere ? '09:00' : heureFormulaire(e.debut),
    fin: e.journeeEntiere ? '10:00' : heureFormulaire(e.fin),
    lieu: e.lieu,
    liens: { recette: e.liens.recette ?? '', liste: e.liens.liste ?? '' },
  }
}
