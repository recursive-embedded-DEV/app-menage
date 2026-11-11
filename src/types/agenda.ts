// Types du module Agenda (les événements viennent de Google Agenda).

// « Pour qui » : chaque personne correspond à un agenda Google, choisi par
// chaque membre dans les réglages. Ordre = ordre d'affichage des filtres.
export const PERSONNES = ['mathieu', 'mariana', 'famille'] as const
export type Personne = (typeof PERSONNES)[number]

// Un agenda Google auquel le compte connecté a accès.
export interface AgendaGoogle {
  id: string // ex. « mathieu@gmail.com » ou « abc…@group.calendar.google.com »
  nom: string
  acces: 'owner' | 'writer' | 'reader' | 'freeBusyReader'
  principal: boolean // l'agenda principal du compte connecté
}

// Réglages d'un membre : l'agenda Google de chaque personne (null = aucun).
export type ReglagesAgenda = Record<Personne, string | null>

export interface Evenement {
  id: string
  agendaId: string
  personne: Personne
  titre: string
  debut: Date // pour une journée entière : minuit (heure du Québec)
  fin: Date // exclusive (comme dans Google Agenda)
  journeeEntiere: boolean
  lieu: string
  // Propriétés cachées de l'événement Google (extendedProperties.private) :
  // liens vers les modules, ex. { recette: 'banh-mi' } (phases G3 et G4).
  liens: Record<string, string>
}
