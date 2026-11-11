import type { AgendaGoogle, Evenement, Personne, ReglagesAgenda } from '../types/agenda'
import { PERSONNES } from '../types/agenda'
import type { ChampsEvenement, EvenementGoogle } from '../utils/agenda'
import { lireEvenementGoogle, versEvenementGoogle } from '../utils/agenda'
import { idUtilisateur } from './auth'
import { jetonValide, oublierJeton } from './google'
import { supabase } from './supabase'

// Le SEUL fichier qui sait où sont les données de l'agenda :
//   - les ÉVÉNEMENTS : Google Agenda (API Calendar v3), jamais copiés ailleurs ;
//   - les RÉGLAGES « quel agenda pour qui » : Supabase (preferences_agenda).

const API = 'https://www.googleapis.com/calendar/v3'

// Le jeton Google manque ou a expiré : l'écran propose de (re)connecter Google.
export class ConnexionGoogleRequise extends Error {}

// Appel à l'API Google Calendar (lecture par défaut ; methode et corps pour
// écrire). Une suppression répond 204, sans contenu : on renvoie alors null.
async function appelerGoogle<T>(
  chemin: string,
  parametres: Record<string, string> = {},
  methode: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  corps?: unknown,
): Promise<T> {
  const jeton = jetonValide()
  if (!jeton) throw new ConnexionGoogleRequise()
  const reponse = await fetch(`${API}/${chemin}?${new URLSearchParams(parametres)}`, {
    method: methode,
    headers: { Authorization: `Bearer ${jeton}`, ...(corps ? { 'Content-Type': 'application/json' } : {}) },
    body: corps ? JSON.stringify(corps) : undefined,
  })
  if (reponse.status === 401) {
    oublierJeton() // jeton révoqué ou expiré plus tôt que prévu
    throw new ConnexionGoogleRequise()
  }
  if (!reponse.ok) throw new Error(`Google Agenda : erreur ${reponse.status}`)
  return (reponse.status === 204 ? null : reponse.json()) as Promise<T>
}

const cheminEvenements = (agendaId: string) => `calendars/${encodeURIComponent(agendaId)}/events`

// ---- Un événement (détail, création, modification, suppression) ----

export async function chargerEvenement(agendaId: string, id: string, personne: Personne): Promise<Evenement | null> {
  const brut = await appelerGoogle<EvenementGoogle>(`${cheminEvenements(agendaId)}/${encodeURIComponent(id)}`)
  return lireEvenementGoogle(brut, agendaId, personne)
}

export async function creerEvenement(agendaId: string, champs: ChampsEvenement): Promise<void> {
  await appelerGoogle(cheminEvenements(agendaId), {}, 'POST', versEvenementGoogle(champs))
}

// Modification : PATCH (seuls les champs envoyés changent ; le reste de
// l'événement Google, comme les invités ou les rappels, est conservé).
// Changer de personne = DÉPLACER l'événement vers l'autre agenda (move),
// pas le recréer. Pour une occurrence d'un événement récurrent, seule cette
// occurrence change (les séries entières : au Backlog).
export async function modifierEvenement(agendaId: string, id: string, champs: ChampsEvenement, nouvelAgendaId: string): Promise<void> {
  let agenda = agendaId
  if (nouvelAgendaId !== agendaId) {
    await appelerGoogle(`${cheminEvenements(agendaId)}/${encodeURIComponent(id)}/move`, { destination: nouvelAgendaId }, 'POST')
    agenda = nouvelAgendaId
  }
  await appelerGoogle(`${cheminEvenements(agenda)}/${encodeURIComponent(id)}`, {}, 'PATCH', versEvenementGoogle(champs))
}

export async function supprimerEvenement(agendaId: string, id: string): Promise<void> {
  await appelerGoogle(`${cheminEvenements(agendaId)}/${encodeURIComponent(id)}`, {}, 'DELETE')
}

// Agendas auxquels le compte connecté a accès (les siens et ceux partagés).
export async function listerAgendas(): Promise<AgendaGoogle[]> {
  const reponse = await appelerGoogle<{
    items?: { id: string; summary?: string; summaryOverride?: string; accessRole: AgendaGoogle['acces']; primary?: boolean }[]
  }>('users/me/calendarList')
  return (reponse.items ?? []).map((a) => ({
    id: a.id,
    // summaryOverride : le nom que l'utilisateur a donné à un agenda partagé.
    nom: a.summaryOverride ?? a.summary ?? a.id,
    acces: a.accessRole,
    principal: Boolean(a.primary),
  }))
}

// Événements de toutes les personnes entre deux instants (une semaine), en
// UNE requête par agenda, lancées en parallèle.
// singleEvents : les événements récurrents arrivent déjà « dépliés ».
export async function chargerEvenements(reglages: ReglagesAgenda, debut: Date, fin: Date): Promise<Evenement[]> {
  const parAgenda = await Promise.all(
    PERSONNES.filter((p) => reglages[p]).map(async (personne: Personne) => {
      const agendaId = reglages[personne]!
      const reponse = await appelerGoogle<{ items?: EvenementGoogle[] }>(cheminEvenements(agendaId), {
        timeMin: debut.toISOString(),
        timeMax: fin.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      })
      return (reponse.items ?? []).flatMap((brut) => {
        const e = lireEvenementGoogle(brut, agendaId, personne)
        return e ? [e] : []
      })
    }),
  )
  // Un même événement peut figurer dans deux agendas (une invitation) : une fois.
  const vus = new Set<string>()
  return parAgenda.flat().filter((e) => (vus.has(e.id) ? false : (vus.add(e.id), true)))
}

// ---- Réglages (Supabase, privés : RLS) ----

// null : le membre n'a encore rien choisi.
export async function chargerReglages(): Promise<ReglagesAgenda | null> {
  const { data, error } = await supabase
    .from('preferences_agenda')
    .select('agenda_mathieu, agenda_mariana, agenda_famille')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { mathieu: data.agenda_mathieu, mariana: data.agenda_mariana, famille: data.agenda_famille }
}

export async function enregistrerReglages(reglages: ReglagesAgenda): Promise<void> {
  const { error } = await supabase.from('preferences_agenda').upsert(
    {
      user_id: await idUtilisateur(),
      agenda_mathieu: reglages.mathieu,
      agenda_mariana: reglages.mariana,
      agenda_famille: reglages.famille,
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

// Prénom du membre connecté (« Mathieu », « Mariana »), pour proposer des
// réglages de départ. La RLS de membres ne renvoie que sa propre fiche.
export async function prenomConnecte(): Promise<string | null> {
  const { data, error } = await supabase.from('membres').select('prenom').maybeSingle()
  if (error) throw error
  return data?.prenom ?? null
}
