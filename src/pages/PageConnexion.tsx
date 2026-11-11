import { useState } from 'react'
import type { FormEvent } from 'react'
import NavBar from '../composants/NavBar'
import { connecter } from '../data/auth'

// Affichée à la place des listes tant qu'on n'est pas connecté.
// Il n'y a pas d'inscription : les deux comptes du ménage sont créés à la
// main dans Supabase.
export default function PageConnexion() {
  const [courriel, setCourriel] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    setEnvoiEnCours(true)
    try {
      await connecter(courriel.trim(), motDePasse)
      // Rien d'autre à faire : useConnexion reçoit l'événement de Supabase
      // et RouteProtegee affiche alors les listes.
    } catch {
      setErreur('Courriel ou mot de passe incorrect.')
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="page-connexion">
      <header className="entete-app">
        <h1>Listes</h1>
        <p>Connecte-toi pour voir les listes du ménage.</p>
      </header>
      <main>
        <form className="formulaire" onSubmit={soumettre}>
          {/* Les attributs autoComplete permettent au trousseau de l'iPhone
              ou au gestionnaire Google de proposer et de retenir le mot de passe. */}
          <label>
            Courriel
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={courriel}
              onChange={(e) => setCourriel(e.target.value)}
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </label>
          {erreur && <p className="message-erreur">{erreur}</p>}
          <button type="submit" className="bouton bouton-liste" disabled={envoiEnCours}>
            {envoiEnCours ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </main>
      <NavBar />
    </div>
  )
}
