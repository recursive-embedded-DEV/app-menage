import { useState } from 'react'
import { Link } from 'react-router'
import NavBar from '../composants/NavBar'
import DialogueAliment from '../composants/DialogueAliment'
import { AlimentUtilise, supprimerAliment } from '../data/aliments'
import { useIdUtilisateur } from '../hooks/useIdUtilisateur'
import { useRechercheAliments } from '../hooks/useRechercheAliments'
import type { Aliment } from '../types/aliment'
import { formaterValeur, resumeValeurs, valeursPour } from '../utils/nutrition'

// « Gérer les aliments » (#/nutrition/aliments) : recherche dans la base
// d'aliments, fiche avec les mesures, création, modification et suppression
// des aliments perso (seulement les siens : c'est aussi la règle RLS).
export default function PageAliments() {
  const [texte, setTexte] = useState('')
  const [version, setVersion] = useState(0) // +1 : relance la recherche
  const [choisi, setChoisi] = useState<Aliment | null>(null)
  // null : boîte fermée ; { aliment: null } : création ; { aliment } : modification.
  const [edition, setEdition] = useState<{ aliment: Aliment | null } | null>(null)
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)
  const { resultats, enCours, erreur } = useRechercheAliments(texte, version)
  const moi = useIdUtilisateur()

  const estAMoi = choisi !== null && choisi.source === 'perso' && choisi.auteur_id === moi

  function choisir(a: Aliment | null) {
    setChoisi(a)
    setConfirmerSuppression(false)
    setErreurSuppression(null)
  }

  async function supprimer() {
    if (!choisi) return
    try {
      await supprimerAliment(choisi.id)
      choisir(null)
      setVersion((v) => v + 1)
    } catch (e) {
      setConfirmerSuppression(false)
      setErreurSuppression(
        e instanceof AlimentUtilise
          ? 'Cet aliment est utilisé dans un journal : il ne peut pas être supprimé. Modifie-le plutôt.'
          : "L'aliment n'a pas été supprimé. Vérifie ta connexion.",
      )
    }
  }

  return (
    <div className="page-aliments">
      <nav className="barre-retour">
        <Link to="/nutrition" className="bouton">← Journal</Link>
      </nav>
      <header className="entete-app">
        <h1>Aliments</h1>
      </header>
      <main>
        <input
          type="search"
          className="champ-recherche"
          placeholder="Rechercher : riz, oeuf, poulet…"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
        />
        {enCours && <p className="note-portions">Recherche…</p>}
        {erreur && <p className="message-erreur">{erreur}</p>}

        {choisi && (
          <section className="carte fiche-aliment">
            <h2>{choisi.nom}</h2>
            <p className="note-portions">
              {choisi.source === 'perso' ? 'Aliment du ménage' : choisi.groupe}
              {choisi.legume_libre && ' · légume : non compté dans les totaux'}
            </p>
            <p>
              <strong>Pour 100 g :</strong> {resumeValeurs(choisi)}
            </p>
            {choisi.mesures.length > 0 && (
              <ul>
                {choisi.mesures.map((m) => (
                  <li key={m.nom}>
                    <strong>
                      {m.nom} ({formaterValeur(m.g, 'proteines_g')} g)
                    </strong>{' '}
                    : {resumeValeurs(valeursPour(choisi, m.g))}
                  </li>
                ))}
              </ul>
            )}

            {/* Modifier / supprimer : seulement ses propres aliments perso. */}
            {estAMoi && !confirmerSuppression && (
              <p className="liens-compte">
                <button type="button" className="bouton-discret" onClick={() => setEdition({ aliment: choisi })}>
                  Modifier
                </button>
                <button type="button" className="bouton-discret" onClick={() => setConfirmerSuppression(true)}>
                  Supprimer
                </button>
              </p>
            )}
            {/* Confirmation intégrée : confirm() du navigateur est peu fiable
                dans une app installée sur l'écran d'accueil. */}
            {confirmerSuppression && (
              <div className="confirmation-suppression" role="alertdialog" aria-label="Confirmer la suppression">
                <p>Supprimer définitivement « {choisi.nom} » ?</p>
                <div className="dialogue-actions">
                  <button type="button" className="bouton" onClick={() => setConfirmerSuppression(false)}>
                    Non
                  </button>
                  <button type="button" className="bouton bouton-danger" onClick={supprimer}>
                    Oui, supprimer
                  </button>
                </div>
              </div>
            )}
            {erreurSuppression && <p className="message-erreur">{erreurSuppression}</p>}
          </section>
        )}

        <ul className="resultats-aliments">
          {resultats.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => choisir(a)}>
                <span>{a.nom}</span>
                <small>
                  {a.source === 'perso' ? '★ ' : ''}
                  {formaterValeur(a.kcal, 'kcal')} kcal / 100 g{a.legume_libre ? ' · légume, non compté' : ''}
                </small>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="bouton bouton-liste" onClick={() => setEdition({ aliment: null })}>
          + Nouvel aliment
        </button>

        {/* Exigence de la Licence du gouvernement ouvert – Canada : citer la source. */}
        <p className="attribution">
          Source des aliments génériques : Fichier canadien sur les éléments nutritifs, Santé Canada, 2026.
          Valeurs approximatives, à titre indicatif.
        </p>
      </main>

      {edition && (
        <DialogueAliment
          aliment={edition.aliment}
          onEnregistre={(a) => {
            choisir(a)
            setVersion((v) => v + 1) // la liste reflète le nouveau nom / les nouvelles valeurs
          }}
          onFerme={() => setEdition(null)}
        />
      )}
      <NavBar />
    </div>
  )
}
