// Connexion à Google (Google Identity Services, « modèle à jeton »), pour lire
// et écrire dans Google Agenda.
//
// Option A (décision de Mathieu) : tout se passe dans le navigateur. Google
// donne un JETON D'ACCÈS valable environ 1 heure ; à son expiration, l'app
// redemande la connexion (souvent un simple toucher). Si c'est trop fréquent
// sur l'iPhone, l'option B (fonction serveur gardant un jeton de longue durée)
// ne changera QUE ce fichier.
//
// Ce fichier n'importe pas Supabase : la déconnexion de l'app (auth.ts) peut
// l'utiliser sans alourdir les pages.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
// Droits minimaux : lire/modifier les ÉVÉNEMENTS, voir la LISTE des agendas.
// L'app ne peut ni supprimer un agenda ni changer ses partages.
const DROITS = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
].join(' ')
const CLE = 'app-mm:google:v1' // { jeton, expire } dans le localStorage

// Types minimaux de la bibliothèque de Google (chargée par une balise <script>).
interface ReponseJeton {
  access_token?: string
  expires_in?: number
  error?: string
}
interface ClientJeton {
  requestAccessToken: (options?: { prompt?: string }) => void
}
interface BibliothequeGoogle {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (reponse: ReponseJeton) => void
        error_callback?: (erreur: { type: string }) => void
      }) => ClientJeton
      revoke: (jeton: string, fini?: () => void) => void
    }
  }
}
declare global {
  interface Window {
    google?: BibliothequeGoogle
  }
}

export function googleConfigure(): boolean {
  return Boolean(CLIENT_ID)
}

// ---- Jeton mémorisé (survit à un rafraîchissement de la page) ----

export function jetonValide(): string | null {
  try {
    const { jeton, expire } = JSON.parse(localStorage.getItem(CLE) ?? '{}') as { jeton?: string; expire?: number }
    // Marge d'une minute : on ne commence pas une requête avec un jeton mourant.
    return jeton && expire && expire - 60_000 > Date.now() ? jeton : null
  } catch {
    return null
  }
}

function memoriserJeton(jeton: string, secondes: number): void {
  try {
    localStorage.setItem(CLE, JSON.stringify({ jeton, expire: Date.now() + secondes * 1000 }))
  } catch {
    // Stockage indisponible : le jeton ne vivra que le temps de la page.
  }
}

export function oublierJeton(): void {
  try {
    localStorage.removeItem(CLE)
  } catch {
    // rien à faire
  }
}

// Déconnexion de l'app : on oublie le jeton ET on le révoque chez Google, pour
// qu'un autre membre qui se connecte sur cet appareil n'en hérite pas.
export function deconnecterGoogle(): void {
  const jeton = jetonValide()
  oublierJeton()
  if (jeton) window.google?.accounts.oauth2.revoke(jeton)
}

// ---- Bibliothèque de Google et demande de jeton ----

let chargement: Promise<void> | null = null

// À appeler dès l'ouverture de l'Agenda : la fenêtre de connexion doit
// s'ouvrir DIRECTEMENT au toucher du bouton (sinon le navigateur la bloque),
// donc la bibliothèque doit déjà être là à ce moment.
export function prechargerGoogle(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve()
  chargement ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      chargement = null
      reject(new Error('Bibliothèque de Google indisponible'))
    }
    document.head.appendChild(script)
  })
  return chargement
}

// Ouvre la connexion Google et renvoie un jeton. À appeler DANS un gestionnaire
// de toucher (onClick), sans attente avant : sinon la fenêtre est bloquée.
// prompt '' : si le compte a déjà accepté, Google ne redemande pas les droits.
export function connecterGoogle(): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = window.google
    if (!CLIENT_ID) return reject(new Error('VITE_GOOGLE_CLIENT_ID manquant'))
    if (!google?.accounts) return reject(new Error('Bibliothèque de Google pas encore chargée'))
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DROITS,
      callback: (reponse) => {
        if (reponse.error || !reponse.access_token) return reject(new Error(reponse.error ?? 'Connexion refusée'))
        memoriserJeton(reponse.access_token, reponse.expires_in ?? 3600)
        resolve(reponse.access_token)
      },
      // Fenêtre fermée par l'utilisateur, ou bloquée.
      error_callback: (erreur) => reject(new Error(erreur.type)),
    })
    client.requestAccessToken({ prompt: '' })
  })
}
