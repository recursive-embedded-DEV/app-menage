import { useEffect, useState } from 'react'
import type { Evenement, ReglagesAgenda } from '../types/agenda'
import { ConnexionGoogleRequise, chargerEvenements, chargerReglages } from '../data/agenda'
import { connecterGoogle, googleConfigure, jetonValide, prechargerGoogle } from '../data/google'
import { debutJour, decalerJours } from '../utils/dates'

// Connexion à Google, partagée par l'agenda et ses réglages.
// connecter() doit être appelée DANS un onClick (fenêtre surgissante).
export function useConnexionGoogle() {
  const [connecte, setConnecte] = useState(() => jetonValide() !== null)
  const [erreur, setErreur] = useState<string | null>(null)

  // Préchargement : au toucher du bouton, la bibliothèque doit déjà être là.
  useEffect(() => {
    prechargerGoogle().catch(() => setErreur('Impossible de joindre Google. Vérifie ta connexion.'))
  }, [])

  function connecter() {
    setErreur(null)
    connecterGoogle()
      .then(() => setConnecte(true))
      .catch(() => setErreur("La connexion à Google n'a pas abouti. Réessaie."))
  }

  return { configure: googleConfigure(), connecte, setConnecte, connecter, erreur }
}

// Agenda d'UNE semaine (lundi AAAA-MM-JJ). La page le recrée (key={lundi}) à
// chaque changement de semaine ; changer de JOUR dans la semaine ne recharge
// rien (les 7 jours sont déjà là).
export function useAgendaSemaine(lundi: string) {
  const google = useConnexionGoogle()
  const { connecte, setConnecte } = google
  // undefined : en lecture ; null : le membre n'a encore rien choisi.
  const [reglages, setReglages] = useState<ReglagesAgenda | null | undefined>(undefined)
  const [evenements, setEvenements] = useState<Evenement[] | null>(null) // null : pas encore chargés
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    chargerReglages()
      .then(setReglages)
      .catch(() => setErreur('Impossible de lire tes réglages. Vérifie ta connexion.'))
  }, [])

  // Dès qu'on a les réglages ET un jeton Google : les événements de la semaine.
  useEffect(() => {
    if (!reglages || !connecte) return
    chargerEvenements(reglages, debutJour(lundi), debutJour(decalerJours(lundi, 7)))
      .then(setEvenements)
      .catch((e) => {
        if (e instanceof ConnexionGoogleRequise) setConnecte(false) // jeton expiré
        else setErreur('Impossible de lire Google Agenda. Vérifie ta connexion.')
      })
  }, [reglages, connecte, lundi, setConnecte])

  return { ...google, erreur: erreur ?? google.erreur, reglages, evenements }
}
