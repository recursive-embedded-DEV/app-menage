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
