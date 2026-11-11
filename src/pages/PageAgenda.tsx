import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import NavBar from '../composants/NavBar'
import { useAgendaSemaine } from '../hooks/useAgenda'
import type { Personne } from '../types/agenda'
import { PERSONNES } from '../types/agenda'
import { COULEURS, NOMS, evenementsDuJour, personnesDuJour } from '../utils/agenda'
import {
  dateLocale,
  debutSemaine,
  decalerJours,
  estDateValide,
  formaterDateLongue,
  heureCourte,
  jourCourt,
  joursSemaine,
  libelleSemaine,
} from '../utils/dates'

// #/agenda (aujourd'hui) ou #/agenda/2026-11-12 (un autre jour).
// UNE journée à la fois (décision de Mathieu) : on touche un jour dans la
// bande du haut ; les flèches changent de semaine.
export default function PageAgenda() {
  const { date: parametre } = useParams()
  const aujourdhui = dateLocale()
  if (parametre && !estDateValide(parametre)) return <Navigate to="/agenda" replace />
  const date = parametre ?? aujourdhui
  // key={lundi} : une autre SEMAINE recharge les événements ; un autre jour
  // de la même semaine, non (ils sont déjà là).
  return <Semaine key={debutSemaine(date)} date={date} aujourdhui={aujourdhui} />
}

function Semaine({ date, aujourdhui }: { date: string; aujourdhui: string }) {
  const lundi = debutSemaine(date)
  const { configure, connecte, connecter, erreur, reglages, evenements } = useAgendaSemaine(lundi)
  const [filtre, setFiltre] = useState<Personne | 'tous'>('tous')

  // Filtres : seulement les personnes qui ont un agenda choisi.
  const personnes = PERSONNES.filter((p) => reglages?.[p])
  const tous = evenements ?? []
  const visibles = filtre === 'tous' ? tous : tous.filter((e) => e.personne === filtre)
  const duJour = evenementsDuJour(visibles, date)
  const titreJour = date === aujourdhui ? `Aujourd'hui · ${formaterDateLongue(date, aujourdhui).toLowerCase()}` : formaterDateLongue(date, aujourdhui)

  return (
    <div className="page-journee">
      <header className="entete-agenda">
        <div className="entete-agenda-titre">
          <h1>Agenda</h1>
          <Link to="/agenda/reglages" className="bouton-discret">
            Réglages
          </Link>
        </div>

        <div className="navigation-semaine">
          <Link to={`/agenda/${decalerJours(lundi, -7)}`} aria-label="Semaine précédente">
            ‹
          </Link>
          <p>{libelleSemaine(date)}</p>
          <Link to={`/agenda/${decalerJours(lundi, 7)}`} aria-label="Semaine suivante">
            ›
          </Link>
        </div>

        {/* La bande des 7 jours : toucher un jour l'affiche (replace : le
            bouton Retour du téléphone ne repasse pas par chaque jour touché). */}
        <nav className="bande-jours" aria-label="Jours de la semaine">
          {joursSemaine(date).map((jour) => {
            const { nom, numero } = jourCourt(jour)
            const actif = jour === date
            return (
              <Link
                key={jour}
                to={`/agenda/${jour}`}
                replace
                className={actif ? 'jour actif' : jour === aujourdhui ? 'jour aujourdhui' : 'jour'}
                aria-current={actif ? 'date' : undefined}
              >
                <span className="jour-nom">{nom}</span>
                <span className="jour-numero">{numero}</span>
                <span className="jour-points" aria-hidden="true">
                  {personnesDuJour(tous, jour).map((p) => (
                    <span key={p} style={{ background: actif ? '#FFFFFF' : COULEURS[p] }} />
                  ))}
                </span>
              </Link>
            )
          })}
        </nav>
      </header>

      {personnes.length > 1 && (
        <div className="filtres-agenda" role="group" aria-label="Filtrer par personne">
          <button type="button" className={filtre === 'tous' ? 'filtre actif' : 'filtre'} onClick={() => setFiltre('tous')}>
            Tous
          </button>
          {personnes.map((p) => (
            <button key={p} type="button" className={filtre === p ? 'filtre actif' : 'filtre'} onClick={() => setFiltre(p)}>
              <span className="pastille-personne" style={{ background: COULEURS[p] }} aria-hidden="true" />
              {NOMS[p]}
            </button>
          ))}
        </div>
      )}

      <main>
        <h2 className="titre-jour">{titreJour}</h2>
        {erreur && <p className="message-erreur">{erreur}</p>}

        {!configure && <p className="message-erreur">Google Agenda n'est pas configuré (VITE_GOOGLE_CLIENT_ID).</p>}
        {configure && reglages === undefined && <p>Chargement…</p>}
        {configure && reglages === null && (
          <p className="note-portions">
            <Link to="/agenda/reglages">Choisis tes agendas Google</Link> pour commencer.
          </p>
        )}
        {configure && reglages && !connecte && (
          <div className="carte connexion-google">
            <p>Pour afficher vos agendas, relie l'app à ton compte Google (valable environ une heure à la fois).</p>
            <button type="button" className="bouton bouton-liste" onClick={connecter}>
              Connecter Google Agenda
            </button>
          </div>
        )}
        {reglages && connecte && evenements === null && <p>Chargement…</p>}
        {evenements !== null && duJour.length === 0 && <p className="note-portions">Rien à l'agenda ce jour-là.</p>}

        <ul className="evenements">
          {duJour.map((e) => (
            <li key={`${e.agendaId}-${e.id}`}>
              {/* Toucher l'événement : son détail (et ses liens vers les modules). */}
              <Link className="evenement" to={`/agenda/evenement/${encodeURIComponent(e.agendaId)}/${encodeURIComponent(e.id)}`}>
              <div className="evenement-heure">
                {e.journeeEntiere ? (
                  <strong>Journée</strong>
                ) : (
                  <>
                    <strong>{heureCourte(e.debut)}</strong>
                    <span>{heureCourte(e.fin)}</span>
                  </>
                )}
              </div>
              <div className="evenement-infos">
                <span className="evenement-titre">{e.titre}</span>
                <span className="evenement-qui">
                  <span className="pastille-personne" style={{ background: COULEURS[e.personne] }} aria-hidden="true" />
                  {NOMS[e.personne]}
                  {e.lieu && ` · ${e.lieu}`}
                </span>
                {/* Liens vers les modules ("" = aucun). */}
                {e.liens.recette && <span className="etiquette-lien">Recette</span>}
                {e.liens.liste && <span className="etiquette-lien">Liste</span>}
              </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      {/* Nouvel événement, au jour affiché. */}
      {reglages && (
        <Link to={`/agenda/nouveau/${date}`} className="fab" aria-label="Nouvel événement">
          +
        </Link>
      )}
      <NavBar />
    </div>
  )
}
