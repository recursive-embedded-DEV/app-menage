import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import NavBar from '../composants/NavBar'
import EditeurIngredients from '../composants/EditeurIngredients'
import { RecetteUtilisee, enregistrerRecette, identifiantLibre, supprimerRecette } from '../data/donnees'
import { useRecette } from '../hooks/useRecettes'
import type { Brouillon } from '../utils/edition-recette'
import { brouillonVide, creerIdentifiant, validerBrouillon, versBrouillon } from '../utils/edition-recette'

// #/recettes/nouvelle (création) ou #/recettes/:id/modifier (modification).
// Réservé aux membres (route protégée ; la base applique aussi la règle RLS).
export default function PageEditionRecette() {
  const { id } = useParams()
  return id ? <ChargerPuisModifier key={id} id={id} /> : <FormulaireRecette depart={brouillonVide()} idExistant={null} />
}

function ChargerPuisModifier({ id }: { id: string }) {
  const { recette, chargement, erreur } = useRecette(id)
  if (!recette) {
    return (
      <div className="page-edition-recette">
        <main>
          {chargement && <p>Chargement…</p>}
          {erreur && <p className="message-erreur">Impossible de charger la recette. Vérifie ta connexion.</p>}
          {!chargement && !erreur && <p>Cette recette n'existe pas.</p>}
        </main>
        <NavBar />
      </div>
    )
  }
  return <FormulaireRecette depart={versBrouillon(recette)} idExistant={id} />
}

interface PropsFormulaire {
  depart: Brouillon
  idExistant: string | null // null : nouvelle recette
}

function FormulaireRecette({ depart, idExistant }: PropsFormulaire) {
  const naviguer = useNavigate()
  // Le brouillon n'est initialisé qu'une fois (valeur de départ de useState).
  const [b, setB] = useState<Brouillon>(depart)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)

  // Change quelques champs du brouillon (nouvel objet : jamais en place).
  const maj = (champs: Partial<Brouillon>) => setB((actuel) => ({ ...actuel, ...champs }))

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validation = validerBrouillon(b, idExistant ?? creerIdentifiant(b.titre))
    if (!validation.ok) {
      setErreur(validation.erreur)
      return
    }
    setEnCours(true)
    setErreur(null)
    try {
      // Nouvelle recette : identifiant libre (« pain-aux-bananes-2 » si besoin).
      // Modification : l'identifiant ne change pas (l'adresse reste valide).
      const id = idExistant ?? (await identifiantLibre(validation.recette.id))
      await enregistrerRecette({ ...validation.recette, id })
      naviguer(`/recettes/${id}`, { replace: true })
    } catch {
      setErreur("La recette n'a pas été enregistrée. Vérifie ta connexion.")
      setEnCours(false)
    }
  }

  async function supprimer() {
    if (!idExistant) return
    try {
      await supprimerRecette(idExistant)
      naviguer('/recettes', { replace: true })
    } catch (e) {
      setConfirmerSuppression(false)
      setErreur(
        e instanceof RecetteUtilisee
          ? 'Cette recette est dans un journal alimentaire : elle ne peut pas être supprimée.'
          : "La recette n'a pas été supprimée. Vérifie ta connexion.",
      )
    }
  }

  return (
    <div className="page-edition-recette">
      <nav className="barre-retour">
        <Link to={idExistant ? `/recettes/${idExistant}` : '/recettes'} className="bouton">
          ← Annuler
        </Link>
      </nav>
      <header className="entete-app">
        <h1>{idExistant ? 'Modifier la recette' : 'Nouvelle recette'}</h1>
      </header>
      <main>
        <form className="formulaire" onSubmit={soumettre}>
          <label>
            Titre
            <input type="text" value={b.titre} onChange={(e) => maj({ titre: e.target.value })} required />
          </label>

          <fieldset>
            <legend>Temps (minutes ; 0 si l'étape n'existe pas)</legend>
            <div className="grille-temps">
              <label>
                Préparation
                <input type="text" inputMode="numeric" value={b.preparation} onChange={(e) => maj({ preparation: e.target.value })} />
              </label>
              <label>
                Cuisson
                <input type="text" inputMode="numeric" value={b.cuisson} onChange={(e) => maj({ cuisson: e.target.value })} />
              </label>
              <label>
                Repos
                <input type="text" inputMode="numeric" value={b.repos} onChange={(e) => maj({ repos: e.target.value })} />
              </label>
            </div>
          </fieldset>

          <div className="grille-valeurs">
            <label>
              Rendement <small>(texte affiché)</small>
              <input type="text" placeholder="4 portions" value={b.rendement} onChange={(e) => maj({ rendement: e.target.value })} />
            </label>
            <label>
              Portions <small>(base des calculs)</small>
              <input type="text" inputMode="decimal" value={b.portions} onChange={(e) => maj({ portions: e.target.value })} />
            </label>
          </div>

          <fieldset>
            <legend>Ingrédients</legend>
            <p className="note-portions">
              Les ingrédients choisis dans la base (🔗) servent au calcul de la valeur nutritive.
              Ce qui n'y est pas (sel, eau…) s'ajoute quand même, sans aliment.
            </p>
            <EditeurIngredients groupes={b.ingredients} onChange={(ingredients) => maj({ ingredients })} />
          </fieldset>

          <fieldset>
            <legend>Préparation</legend>
            {b.etapes.map((g) => (
              <div key={g.cle} className="groupe-edition">
                <label>
                  Section <small>(facultatif)</small>
                  <input
                    type="text"
                    value={g.section}
                    onChange={(e) => maj({ etapes: b.etapes.map((x) => (x.cle === g.cle ? { ...x, section: e.target.value } : x)) })}
                  />
                </label>
                <label>
                  Étapes <small>(une par ligne)</small>
                  <textarea
                    rows={6}
                    value={g.texte}
                    onChange={(e) => maj({ etapes: b.etapes.map((x) => (x.cle === g.cle ? { ...x, texte: e.target.value } : x)) })}
                  />
                </label>
                {b.etapes.length > 1 && (
                  <button
                    type="button"
                    className="bouton-discret"
                    onClick={() => maj({ etapes: b.etapes.filter((x) => x.cle !== g.cle) })}
                  >
                    Retirer la section
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="bouton-discret"
              onClick={() => maj({ etapes: [...b.etapes, { cle: crypto.randomUUID(), section: '', texte: '' }] })}
            >
              + Nouvelle section d'étapes
            </button>
          </fieldset>

          <label>
            Notes <small>(une par ligne, facultatif)</small>
            <textarea rows={3} value={b.notes} onChange={(e) => maj({ notes: e.target.value })} />
          </label>

          {erreur && <p className="message-erreur">{erreur}</p>}
          <button type="submit" className="bouton bouton-liste" disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer la recette'}
          </button>

          {idExistant && !confirmerSuppression && (
            <button type="button" className="bouton-discret" onClick={() => setConfirmerSuppression(true)}>
              Supprimer la recette
            </button>
          )}
          {/* Confirmation intégrée (confirm() est peu fiable dans une app installée). */}
          {confirmerSuppression && (
            <div className="confirmation-suppression" role="alertdialog" aria-label="Confirmer la suppression">
              <p>Supprimer définitivement « {b.titre} » et tous ses ingrédients ?</p>
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
        </form>
      </main>
      <NavBar />
    </div>
  )
}
