import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import BarreHaut from '../composants/BarreHaut'
import NavBar from '../composants/NavBar'
import { ConnexionGoogleRequise, chargerReglages, enregistrerReglages, listerAgendas, prenomConnecte } from '../data/agenda'
import { deconnecterGoogle } from '../data/google'
import { useConnexionGoogle } from '../hooks/useAgenda'
import { useRetour } from '../hooks/useRetour'
import type { AgendaGoogle, Personne, ReglagesAgenda } from '../types/agenda'
import { PERSONNES } from '../types/agenda'
import { COULEURS, NOMS, proposerReglages } from '../utils/agenda'

// #/agenda/reglages : relier Google, puis choisir l'agenda Google de chaque
// personne (Mathieu, Mariana, Ménage). Réglages privés, gardés dans Supabase.
export default function PageReglagesAgenda() {
  const { retour } = useRetour('/agenda')
  const { configure, connecte, setConnecte, connecter, erreur: erreurGoogle } = useConnexionGoogle()
  const [agendas, setAgendas] = useState<AgendaGoogle[] | null>(null)
  const [choix, setChoix] = useState<ReglagesAgenda | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  // Une fois connecté : la liste des agendas, les réglages enregistrés (ou,
  // la première fois, une proposition à confirmer).
  useEffect(() => {
    if (!connecte) return
    Promise.all([listerAgendas(), chargerReglages(), prenomConnecte()])
      .then(([liste, enregistres, prenom]) => {
        setAgendas(liste)
        setChoix(enregistres ?? proposerReglages(liste, prenom))
      })
      .catch((e) => {
        if (e instanceof ConnexionGoogleRequise) setConnecte(false)
        else setErreur('Impossible de lire tes agendas. Vérifie ta connexion.')
      })
  }, [connecte, setConnecte])

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!choix) return
    setEnCours(true)
    try {
      await enregistrerReglages(choix)
      retour()
    } catch {
      setErreur("Les réglages n'ont pas été enregistrés. Vérifie ta connexion.")
      setEnCours(false)
    }
  }

  const changer = (p: Personne, valeur: string) => setChoix((c) => (c ? { ...c, [p]: valeur || null } : c))

  return (
    <div className="page-journee">
      <BarreHaut repli="/agenda" />
      <header className="entete-app">
        <h1>Réglages de l'agenda</h1>
      </header>
      <main>
        {!configure && <p className="message-erreur">Google Agenda n'est pas configuré (VITE_GOOGLE_CLIENT_ID).</p>}
        {(erreur || erreurGoogle) && <p className="message-erreur">{erreur ?? erreurGoogle}</p>}

        {configure && !connecte && (
          <div className="carte connexion-google">
            <p>Relie l'app à ton compte Google pour choisir tes agendas.</p>
            <button type="button" className="bouton bouton-liste" onClick={connecter}>
              Connecter Google Agenda
            </button>
          </div>
        )}

        {connecte && !choix && !erreur && <p>Chargement…</p>}

        {connecte && agendas && choix && (
          <form className="formulaire" onSubmit={soumettre}>
            <p className="note-portions">
              Quel agenda Google correspond à chaque personne ? Les événements de ces agendas s'affichent dans l'app, avec
              leur couleur.
            </p>
            {PERSONNES.map((p) => (
              <label key={p}>
                <span className="libelle-personne">
                  <span className="pastille-personne" style={{ background: COULEURS[p] }} aria-hidden="true" />
                  {NOMS[p]}
                </span>
                <select value={choix[p] ?? ''} onChange={(e) => changer(p, e.target.value)}>
                  <option value="">— Aucun —</option>
                  {agendas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom}
                      {a.principal ? ' (mon agenda principal)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button type="submit" className="bouton bouton-liste" disabled={enCours}>
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              className="bouton-discret"
              onClick={() => {
                deconnecterGoogle()
                setConnecte(false)
                setAgendas(null)
                setChoix(null)
              }}
            >
              Déconnecter Google
            </button>
          </form>
        )}
      </main>
      <NavBar />
    </div>
  )
}
