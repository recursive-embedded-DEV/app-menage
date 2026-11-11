import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import NavBar from '../composants/NavBar'
import {
  ConnexionGoogleRequise,
  chargerEvenement,
  chargerReglages,
  creerEvenement,
  listerAgendas,
  modifierEvenement,
  prenomConnecte,
} from '../data/agenda'
import { chargerRecettes } from '../data/donnees'
import { titresListes } from '../data/stockage-listes'
import { useConnexionGoogle } from '../hooks/useAgenda'
import type { Personne, ReglagesAgenda } from '../types/agenda'
import { PERSONNES } from '../types/agenda'
import type { ResumeRecette } from '../types/recette'
import type { ChampsEvenement } from '../utils/agenda'
import { COULEURS, NOMS, ajouterMinutes, validerChamps, versChamps } from '../utils/agenda'
import { dateLocale, heureLocale } from '../utils/dates'

type TypeLien = 'rien' | 'recette' | 'liste'

// Valeurs de départ d'un NOUVEL événement : l'heure pleine suivante si c'est
// aujourd'hui (sinon 9 h), pour une heure.
function champsVides(date: string): ChampsEvenement {
  const debut = date === dateLocale() ? `${String(Math.min(heureLocale() + 1, 22)).padStart(2, '0')}:00` : '09:00'
  return { titre: '', date, journeeEntiere: false, debut, fin: ajouterMinutes(debut, 60), lieu: '', liens: { recette: '', liste: '' } }
}

// #/agenda/nouveau/:date (création) ou #/agenda/evenement/:agendaId/:id/modifier.
export default function PageFormulaireEvenement() {
  const { date, agendaId, id } = useParams()
  const modification = Boolean(agendaId && id)
  const naviguer = useNavigate()
  const { configure, connecte, setConnecte, connecter, erreur: erreurGoogle } = useConnexionGoogle()

  const [reglages, setReglages] = useState<ReglagesAgenda | null>(null)
  const [modifiables, setModifiables] = useState<Set<string>>(new Set()) // agendas où l'on peut écrire
  const [recettes, setRecettes] = useState<ResumeRecette[]>([])
  const [listes, setListes] = useState<{ id: string; titre: string }[]>([])
  const [champs, setChamps] = useState<ChampsEvenement | null>(null)
  const [personne, setPersonne] = useState<Personne>('famille')
  const [typeLien, setTypeLien] = useState<TypeLien>('rien')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    if (!connecte) return
    Promise.all([chargerReglages(), listerAgendas(), chargerRecettes(), titresListes(), prenomConnecte()])
      .then(async ([r, agendas, toutesRecettes, toutesListes, prenom]) => {
        setReglages(r)
        // owner / writer : on peut y créer et modifier des événements.
        setModifiables(new Set(agendas.filter((a) => a.acces === 'owner' || a.acces === 'writer').map((a) => a.id)))
        setRecettes(toutesRecettes)
        setListes(toutesListes)
        if (modification && agendaId && id) {
          const p = PERSONNES.find((x) => r?.[x] === agendaId) ?? 'famille'
          const e = await chargerEvenement(agendaId, id, p)
          if (!e) return setErreur("Cet événement n'existe plus.")
          const c = versChamps(e)
          setChamps(c)
          setPersonne(p)
          setTypeLien(c.liens.recette ? 'recette' : c.liens.liste ? 'liste' : 'rien')
        } else {
          setChamps(champsVides(date ?? dateLocale()))
          // Par défaut : soi-même (sinon Ménage).
          const moi = PERSONNES.find((x) => NOMS[x].toLowerCase() === prenom?.toLowerCase())
          setPersonne(moi ?? 'famille')
        }
      })
      .catch((e) => {
        if (e instanceof ConnexionGoogleRequise) setConnecte(false)
        else setErreur('Impossible de préparer le formulaire. Vérifie ta connexion.')
      })
  }, [connecte, setConnecte, modification, agendaId, id, date])

  const maj = (modifs: Partial<ChampsEvenement>) => setChamps((c) => (c ? { ...c, ...modifs } : c))
  const peutEcrire = (p: Personne) => Boolean(reglages?.[p] && modifiables.has(reglages[p]!))

  // Nouvelle heure de début : si la fin ne la suit plus, on la repousse d'une heure.
  function changerDebut(debut: string) {
    setChamps((c) => (c ? { ...c, debut, fin: c.fin > debut ? c.fin : ajouterMinutes(debut, 60) } : c))
  }

  function changerTypeLien(t: TypeLien) {
    setTypeLien(t)
    maj({ liens: { recette: '', liste: '' } }) // un seul lien à la fois
  }

  // Recette choisie : titre « Souper : … » proposé si le titre est encore vide.
  function choisirRecette(idRecette: string) {
    const r = recettes.find((x) => x.id === idRecette)
    setChamps((c) => (c ? { ...c, titre: c.titre || (r ? `Souper : ${r.titre}` : ''), liens: { recette: idRecette, liste: '' } } : c))
  }

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!champs || !reglages) return
    const probleme = validerChamps(champs) ?? (peutEcrire(personne) ? null : `L'agenda de ${NOMS[personne]} n'est pas modifiable.`)
    if (probleme) return setErreur(probleme)
    const destination = reglages[personne]!
    setEnCours(true)
    setErreur(null)
    try {
      if (modification && agendaId && id) await modifierEvenement(agendaId, id, champs, destination)
      else await creerEvenement(destination, champs)
      naviguer(`/agenda/${champs.date}`, { replace: true })
    } catch (err) {
      if (err instanceof ConnexionGoogleRequise) setConnecte(false)
      setErreur("L'événement n'a pas été enregistré. Vérifie ta connexion.")
      setEnCours(false)
    }
  }

  const retour = modification && agendaId && id ? `/agenda/evenement/${encodeURIComponent(agendaId)}/${encodeURIComponent(id)}` : `/agenda/${date ?? ''}`

  return (
    <div className="page-journee">
      <nav className="barre-retour">
        <Link to={retour} className="bouton">← Annuler</Link>
      </nav>
      <header className="entete-app">
        <h1>{modification ? "Modifier l'événement" : 'Nouvel événement'}</h1>
      </header>
      <main>
        {!configure && <p className="message-erreur">Google Agenda n'est pas configuré (VITE_GOOGLE_CLIENT_ID).</p>}
        {configure && !connecte && (
          <div className="carte connexion-google">
            <p>Relie l'app à Google pour enregistrer dans tes agendas.</p>
            <button type="button" className="bouton bouton-liste" onClick={connecter}>
              Connecter Google Agenda
            </button>
          </div>
        )}
        {connecte && !champs && !erreur && <p>Chargement…</p>}

        {champs && (
          <form className="formulaire" onSubmit={soumettre}>
            <label>
              Titre
              <input type="text" value={champs.titre} onChange={(e) => maj({ titre: e.target.value })} required />
            </label>

            <fieldset>
              <legend>Pour qui</legend>
              <div className="choix-personnes">
                {PERSONNES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={personne === p ? 'choix actif' : 'choix'}
                    style={personne === p ? { background: COULEURS[p], borderColor: COULEURS[p] } : undefined}
                    disabled={!peutEcrire(p)}
                    title={peutEcrire(p) ? undefined : 'Agenda non choisi ou en lecture seule'}
                    aria-pressed={personne === p}
                    onClick={() => setPersonne(p)}
                  >
                    <span className="pastille-personne" style={{ background: personne === p ? '#FFFFFF' : COULEURS[p] }} aria-hidden="true" />
                    {NOMS[p]}
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              Date
              <input type="date" value={champs.date} onChange={(e) => maj({ date: e.target.value })} required />
            </label>
            <label className="interrupteur">
              <input type="checkbox" checked={champs.journeeEntiere} onChange={(e) => maj({ journeeEntiere: e.target.checked })} />
              <span>
                <strong>Toute la journée</strong>
              </span>
            </label>
            {!champs.journeeEntiere && (
              <div className="grille-valeurs">
                <label>
                  Début
                  <input type="time" value={champs.debut} onChange={(e) => changerDebut(e.target.value)} required />
                </label>
                <label>
                  Fin
                  <input type="time" value={champs.fin} onChange={(e) => maj({ fin: e.target.value })} required />
                </label>
              </div>
            )}
            <label>
              Lieu <small>(facultatif)</small>
              <input type="text" value={champs.lieu} onChange={(e) => maj({ lieu: e.target.value })} />
            </label>

            <fieldset>
              <legend>Relier à (facultatif)</legend>
              <div className="choix-personnes">
                {(['rien', 'recette', 'liste'] as const).map((t) => (
                  <button key={t} type="button" className={typeLien === t ? 'choix actif' : 'choix'} aria-pressed={typeLien === t} onClick={() => changerTypeLien(t)}>
                    {t === 'rien' ? 'Rien' : t === 'recette' ? 'Une recette' : 'Une liste'}
                  </button>
                ))}
              </div>
              {typeLien === 'recette' && (
                <select aria-label="Recette" value={champs.liens.recette} onChange={(e) => choisirRecette(e.target.value)}>
                  <option value="">— Choisir une recette —</option>
                  {recettes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.titre}
                    </option>
                  ))}
                </select>
              )}
              {typeLien === 'liste' && (
                <select aria-label="Liste" value={champs.liens.liste} onChange={(e) => maj({ liens: { recette: '', liste: e.target.value } })}>
                  <option value="">— Choisir une liste —</option>
                  {listes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.titre}
                    </option>
                  ))}
                </select>
              )}
            </fieldset>

            {(erreur || erreurGoogle) && <p className="message-erreur">{erreur ?? erreurGoogle}</p>}
            <button type="submit" className="bouton bouton-liste" disabled={enCours}>
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        )}
      </main>
      <NavBar />
    </div>
  )
}
