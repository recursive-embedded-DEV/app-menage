// Types des variables d'environnement lues par Vite (fichier .env.local en
// développement, secrets GitHub au moment du build de production).
// Sans ce fichier, TypeScript ne connaîtrait pas import.meta.env.VITE_SUPABASE_URL.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}
