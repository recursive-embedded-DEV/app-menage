// Types du module virtuel 'virtual:pwa-register/react' (fourni par vite-plugin-pwa
// au build ; il n'existe pas sur le disque, d'où cette déclaration).
/// <reference types="vite-plugin-pwa/react" />

// Types des variables d'environnement lues par Vite (fichier .env.local en
// développement, secrets GitHub au moment du build de production).
// Sans ce fichier, TypeScript ne connaîtrait pas import.meta.env.VITE_SUPABASE_URL.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  // Facultative : sans elle, la recherche de livres saute Google Books.
  readonly VITE_GOOGLE_BOOKS_KEY?: string
  // ID client OAuth de Google (Agenda) : public, valable seulement pour les
  // origines autorisées dans la console Google Cloud.
  readonly VITE_GOOGLE_CLIENT_ID?: string
}
