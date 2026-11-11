import { useState } from 'react'
import { Link, useParams } from 'react-router'
import BarreHaut, { LienModifier } from '../composants/BarreHaut'
import NavBar from '../composants/NavBar'
import DialogueEpicerie from '../composants/DialogueEpicerie'
import SelecteurPortions from '../composants/SelecteurPortions'
import SectionNutritionRecette from '../composants/SectionNutritionRecette'
import { useConnexion } from '../hooks/useConnexion'
import { useRecette } from '../hooks/useRecettes'
import type { Recette } from '../types/recette'
import { ajusterQuantite } from '../utils/portions'
import { cheminImage, formaterDuree } from '../utils/temps'

export default function PageRecette() {
  // :id dans la route "/recettes/:id" → ex. "banh-mi"
  const { id = '' } = useParams()
  // key={id} : une autre recette = un chargement neuf.
  return <ChargementRecette key={id} id={id} />
}

function ChargementRecette({ id }: { id: string }) {
  const { recette, chargement, erreur } = useRecette(id)

  if (!recette) {
    return (
      <div className="page-recette">
        <BarreHaut repli="/recettes" />
        <main>
          {chargement && <p>Chargement…</p>}
          {erreur && <p className="message-erreur">Impossible de charger la recette. Vérifie ta connexion.</p>}
          {!chargement && !erreur && <p>Cette recette n'existe pas.</p>}
        </main>
        <NavBar />
      </div>
    )
  }

  // key : passer d'une recette à l'autre recrée le contenu, donc le nombre de
  // portions repart de la valeur de base de la nouvelle recette.
  return <ContenuRecette key={recette.id} recette={recette} />
}

// Séparé de PageRecette pour que les hooks (useState…) soient appelés à chaque
// rendu, sans condition : la règle des hooks interdit de les placer après le
// « return » anticipé de la recette introuvable.
function ContenuRecette({ recette }: { recette: Recette }) {
  const [portions, setPortions] = useState(recette.portions)
  const connexion = useConnexion()

  // Facteur de multiplication des quantités : 6 portions sur une base de 4 → 1,5.
  const facteur = portions / recette.portions
  const ajustee = portions !== recette.portions

  // On n'affiche que les temps non nuls (convention des zéros).
  const temps = [
    { libelle: 'Préparation', minutes: recette.temps.preparation_min },
    { libelle: 'Cuisson', minutes: recette.temps.cuisson_min },
    { libelle: 'Repos', minutes: recette.temps.repos_min },
  ].filter((t) => t.minutes > 0)

  return (
    <div className="page-recette">
      <BarreHaut repli="/recettes">
        {/* Modifier : membres connectés (la route et la base le vérifient aussi). */}
        {connexion === 'connecte' && <LienModifier vers={`/recettes/${recette.id}/modifier`} libelle="Modifier la recette" />}
      </BarreHaut>

      <header className="entete-app">
        {recette.image && <img src={cheminImage(recette.image)} alt={recette.titre} />}
        <div className="entete-infos">
          <h1>{recette.titre}</h1>
          <div className="meta">
            {temps.map((t) => (
              <div className="meta-item" key={t.libelle}>
                <p>{t.libelle}</p>
                <p className="specific">{formaterDuree(t.minutes)}</p>
              </div>
            ))}
            <div className="meta-item">
              <p>Rendement</p>
              <p className="specific">{recette.rendement}</p>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="ingredients">
          <h2>Ingrédients</h2>
          <SelecteurPortions valeur={portions} onChange={setPortions} />
          {ajustee && (
            <p className="note-portions">
              Quantités ajustées pour {portions} portion{portions >= 2 ? 's' : ''} (recette originale :{' '}
              {recette.rendement}). Les étapes ne sont pas ajustées.
            </p>
          )}
          {recette.ingredients.map((groupe, i) => (
            <div key={i}>
              {groupe.section && <h3>{groupe.section}</h3>}
              <ul>
                {groupe.items.map((ing, j) => (
                  <li key={j}><strong>{ing.nom}</strong> - {ajusterQuantite(ing.quantite, facteur)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Valeur nutritive et « J'en ai mangé » : membres seulement (base d'aliments protégée). */}
        {connexion === 'connecte' && <SectionNutritionRecette recette={recette} />}

        {/* La liste d'épicerie est réservée au ménage : les Recettes, elles, sont publiques. */}
        {connexion === 'connecte' && <DialogueEpicerie recette={recette} portionsPage={portions} />}
        {connexion === 'deconnecte' && (
          <p className="note-portions">
            <Link to="/listes">Connecte-toi dans Listes</Link> pour ajouter les ingrédients à l'épicerie.
          </p>
        )}

        <div className="instructions">
          <h2>Préparation</h2>
          {recette.etapes.map((groupe, i) => (
            <div key={i}>
              {groupe.section && <h3>{groupe.section}</h3>}
              <ol>
                {groupe.items.map((etape, j) => (
                  <li key={j}>{etape}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {recette.notes.length > 0 && (
          <div className="notes">
            <h2>Notes</h2>
            <ul>
              {recette.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <NavBar />
    </div>
  )
}
