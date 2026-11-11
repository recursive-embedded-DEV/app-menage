import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import NavBar from '../composants/NavBar'
import DialogueEpicerie from '../composants/DialogueEpicerie'
import SectionNutritionRecette from '../composants/SectionNutritionRecette'
import { ConnexionGoogleRequise, chargerEvenement, chargerReglages, supprimerEvenement } from '../data/agenda'
import { chargerRecette } from '../data/donnees'
import { titresListes } from '../data/stockage-listes'
import { useConnexionGoogle } from '../hooks/useAgenda'
import type { Evenement } from '../types/agenda'
import { PERSONNES } from '../types/agenda'
import type { Recette } from '../types/recette'
import { COULEURS, NOMS } from '../utils/agenda'
import { dateLocale, formaterDateLongue, heureCourte } from '../utils/dates'
import { cheminImage } from '../utils/temps'

// #/agenda/evenement/:agendaId/:id — détail d'un événement (maquette, écran 2) :
// date, heures, lieu, et ses LIENS vers les modules (recette, liste).
export default function PageEvenement() {
  const { agendaId = '', id = '' } = useParams()
  const naviguer = useNavigate()
  const { configure, connecte, setConnecte, connecter, erreur: erreurGoogle } = useConnexionGoogle()
  const [evenement, setEvenement] = useState<Evenement | null | undefined>(undefined) // undefined : en lecture
  const [recette, setRecette] = useState<Recette | null>(null)
  const [titreListe, setTitreListe] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [confirmer, setConfirmer] = useState(false)

  useEffect(() => {
    if (!connecte) return
    chargerReglages()
      .then((reglages) => {
        // La personne : celle dont l'agenda est celui de l'événement.
        const personne = PERSONNES.find((p) => reglages?.[p] === agendaId) ?? 'famille'
        return chargerEvenement(agendaId, id, personne)
      })
      .then((e) => {
        setEvenement(e)
        // Les liens : la recette (complète, pour sa valeur nutritive) et le nom de la liste.
        if (e?.liens.recette) chargerRecette(e.liens.recette).then((r) => setRecette(r ?? null))
        if (e?.liens.liste) {
          titresListes().then((listes) => setTitreListe(listes.find((l) => l.id === e.liens.liste)?.titre ?? null))
        }
      })
      .catch((e) => {
        if (e instanceof ConnexionGoogleRequise) setConnecte(false)
        else setErreur('Impossible de lire cet événement. Vérifie ta connexion.')
      })
  }, [connecte, agendaId, id, setConnecte])

  const jour = evenement ? dateLocale(evenement.debut) : ''

  async function supprimer() {
    try {
      await supprimerEvenement(agendaId, id)
      naviguer(`/agenda/${jour}`, { replace: true })
    } catch {
      setConfirmer(false)
      setErreur("L'événement n'a pas été supprimé. Vérifie ta connexion.")
    }
  }

  return (
    <div className="page-journee">
      <nav className="barre-retour">
        <Link to={jour ? `/agenda/${jour}` : '/agenda'} className="bouton">← Agenda</Link>
        {evenement && (
          <Link to={`/agenda/evenement/${encodeURIComponent(agendaId)}/${encodeURIComponent(id)}/modifier`} className="bouton">
            Modifier
          </Link>
        )}
      </nav>

      {!configure && <p className="message-erreur">Google Agenda n'est pas configuré (VITE_GOOGLE_CLIENT_ID).</p>}
      {(erreur || erreurGoogle) && <p className="message-erreur">{erreur ?? erreurGoogle}</p>}
      {configure && !connecte && (
        <main>
          <div className="carte connexion-google">
            <p>Relie l'app à Google pour afficher cet événement.</p>
            <button type="button" className="bouton bouton-liste" onClick={connecter}>
              Connecter Google Agenda
            </button>
          </div>
        </main>
      )}
      {connecte && evenement === undefined && !erreur && <p>Chargement…</p>}
      {connecte && evenement === null && <p className="note-portions">Cet événement n'existe plus.</p>}

      {evenement && (
        <>
          <header className="entete-evenement">
            <span className="etiquette-personne">
              <span className="pastille-personne" style={{ background: COULEURS[evenement.personne] }} aria-hidden="true" />
              {NOMS[evenement.personne]}
            </span>
            <h1>{evenement.titre}</h1>
            <p>
              {formaterDateLongue(jour)} ·{' '}
              {evenement.journeeEntiere ? 'toute la journée' : `${heureCourte(evenement.debut)} à ${heureCourte(evenement.fin)}`}
            </p>
            {evenement.lieu && <p>{evenement.lieu}</p>}
          </header>

          <main className="contenu-evenement">
            {/* Recette liée : carte, valeur nutritive, « J'en ai mangé », épicerie. */}
            {recette && (
              <section className="carte recette-liee">
                {recette.image && <img src={cheminImage(recette.image)} alt={recette.titre} />}
                <h2>{recette.titre}</h2>
                <SectionNutritionRecette recette={recette} />
                <DialogueEpicerie recette={recette} portionsPage={recette.portions} />
                <Link to={`/recettes/${recette.id}`} className="bouton bouton-liste">
                  Voir la recette
                </Link>
              </section>
            )}

            {evenement.liens.liste && (
              <Link to={`/listes/${evenement.liens.liste}`} className="bouton bouton-liste">
                Ouvrir la liste {titreListe ? `« ${titreListe} »` : ''}
              </Link>
            )}

            {!confirmer && (
              <button type="button" className="bouton-discret" onClick={() => setConfirmer(true)}>
                Supprimer l'événement
              </button>
            )}
            {/* Confirmation intégrée (confirm() est peu fiable dans une app installée). */}
            {confirmer && (
              <div className="confirmation-suppression" role="alertdialog" aria-label="Confirmer la suppression">
                <p>Supprimer « {evenement.titre} » de Google Agenda ?</p>
                <div className="dialogue-actions">
                  <button type="button" className="bouton" onClick={() => setConfirmer(false)}>
                    Non
                  </button>
                  <button type="button" className="bouton bouton-danger" onClick={supprimer}>
                    Oui, supprimer
                  </button>
                </div>
              </div>
            )}
          </main>
        </>
      )}
      <NavBar />
    </div>
  )
}
