// Dates du journal alimentaire : toujours le jour LOCAL du Québec.
//
// Piège classique : new Date().toISOString() donne la date en UTC. À 23 h 30
// au Québec, il est déjà le lendemain en UTC : la collation du soir serait
// comptée le jour suivant. On passe donc toujours par le fuseau America/Toronto.
// Format échangé avec la base : « AAAA-MM-JJ » (type date de PostgreSQL).

export const FUSEAU = 'America/Toronto'

// « 2026-11-11 » : le jour local de l'instant donné (maintenant par défaut).
// La locale en-CA écrit justement les dates au format AAAA-MM-JJ.
export function dateLocale(instant: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSEAU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

// Heure locale (0 à 23) de l'instant donné.
export function heureLocale(instant: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, hour: 'numeric', hourCycle: 'h23' }).format(instant),
  )
}

// Ajoute (ou retire) des jours à une date AAAA-MM-JJ. Calcul fait en UTC sur
// une date « à minuit » : aucun fuseau ni changement d'heure ne s'en mêle.
export function decalerJours(date: string, jours: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + jours)
  return d.toISOString().slice(0, 10)
}

// Vrai pour une vraie date AAAA-MM-JJ (« 2026-02-30 » est refusée).
export function estDateValide(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const d = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date
}

// « Mardi 11 novembre » (l'année seulement si ce n'est pas l'année en cours).
export function formaterDateLongue(date: string, aujourdhui: string = dateLocale()): string {
  const memeAnnee = date.slice(0, 4) === aujourdhui.slice(0, 4)
  const texte = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'UTC', // la date est « à minuit UTC » : on l'affiche telle quelle
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(memeAnnee ? {} : { year: 'numeric' }),
  }).format(new Date(`${date}T00:00:00Z`))
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

// ---------------------------------------------------------------------
// Agenda : bornes d'une journée et semaine (lundi → dimanche), au fuseau du Québec.
// ---------------------------------------------------------------------

// Écart en minutes entre l'heure de Montréal et l'UTC à un instant donné
// (−300 en hiver, −240 en été). Calculé, jamais codé en dur : il change deux
// fois par année (heure avancée).
export function decalageFuseau(instant: Date): number {
  const parties = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSEAU,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  )
  const commeUtc = Date.UTC(+parties.year, +parties.month - 1, +parties.day, +parties.hour, +parties.minute, +parties.second)
  return Math.round((commeUtc - instant.getTime()) / 60000)
}

// Instant (UTC) où commence la journée locale AAAA-MM-JJ : minuit à Montréal.
// Sert de borne aux requêtes à Google Agenda (timeMin, timeMax).
export function debutJour(date: string): Date {
  const [a, m, j] = date.split('-').map(Number)
  const minuitUtc = Date.UTC(a, m - 1, j)
  // 1er essai avec l'écart de minuit UTC, puis correction avec l'écart réel
  // à l'instant trouvé (utile les jours de changement d'heure).
  const essai = minuitUtc - decalageFuseau(new Date(minuitUtc)) * 60000
  return new Date(minuitUtc - decalageFuseau(new Date(essai)) * 60000)
}

// Lundi de la semaine d'une date (la semaine commence le lundi au Québec).
export function debutSemaine(date: string): string {
  const jourSemaine = new Date(`${date}T00:00:00Z`).getUTCDay() // 0 = dimanche
  return decalerJours(date, -((jourSemaine + 6) % 7))
}

// Les 7 dates de la semaine (lundi → dimanche) d'une date.
export function joursSemaine(date: string): string[] {
  const lundi = debutSemaine(date)
  return Array.from({ length: 7 }, (_, i) => decalerJours(lundi, i))
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

// « 9 au 15 novembre 2026 » ; sur deux mois : « 30 novembre au 6 décembre 2026 » ;
// sur deux années : « 28 décembre 2026 au 3 janvier 2027 ».
export function libelleSemaine(date: string): string {
  const jours = joursSemaine(date)
  const [a1, m1, j1] = jours[0].split('-').map(Number)
  const [a2, m2, j2] = jours[6].split('-').map(Number)
  if (a1 !== a2) return `${j1} ${MOIS[m1 - 1]} ${a1} au ${j2} ${MOIS[m2 - 1]} ${a2}`
  if (m1 !== m2) return `${j1} ${MOIS[m1 - 1]} au ${j2} ${MOIS[m2 - 1]} ${a2}`
  return `${j1} au ${j2} ${MOIS[m2 - 1]} ${a2}`
}

const JOURS_COURTS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

// « mer » et « 11 » pour la bande des jours.
export function jourCourt(date: string): { nom: string; numero: number } {
  const d = new Date(`${date}T00:00:00Z`)
  return { nom: JOURS_COURTS[d.getUTCDay()], numero: d.getUTCDate() }
}

// Heure locale lisible : « 6 h 30 », « 14 h ».
export function heureCourte(instant: Date): string {
  const [h, m] = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' })
    .format(instant)
    .split(':')
    .map(Number)
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}
