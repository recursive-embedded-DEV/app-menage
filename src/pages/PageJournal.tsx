import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import NavBar from '../composants/NavBar'
import Pastille from '../composants/Pastille'
import DialogueAjoutJournal from '../composants/DialogueAjoutJournal'
import DialogueRecetteJournal from '../composants/DialogueRecetteJournal'
import { trouverRecette } from '../data/donnees'
import { useJournal } from '../hooks/useJournal'
import { useProfilNutrition } from '../hooks/useProfilNutrition'
import type { EntreeJournal } from '../types/journal'
import { dateLocale, decalerJours, estDateValide, formaterDateLongue } from '../utils/dates'
import { CLES_VALEURS, REPAS, formaterValeur, totauxJournal, valeursEntree } from '../utils/nutrition'

// #/nutrition (aujourd'hui) ou #/nutrition/2026-11-11 (un autre jour).
export default function PageJournal() {
  const { date: parametre } = useParams()
  const aujourdhui = dateLocale()

  // Adresse invalide (#/nutrition/n-importe-quoi) : retour à aujourd'hui.
  if (parametre && !estDateValide(parametre)) return <Navigate to="/nutrition" replace />
  const date = parametre ?? aujourdhui

  // key={date} : changer de jour recrée le journal (état neuf, « Chargement… »).
  return <Journal key={date} date={date} aujourdhui={aujourdhui} />
}

// Nom affiché d'une entrée : l'aliment, ou le titre de la recette.
function nomEntree(e: EntreeJournal): string {
  return e.type === 'aliment' ? e.aliment.nom : (trouverRecette(e.recette_id)?.titre ?? 'Recette introuvable')
}

function Journal({ date, aujourdhui }: { date: string; aujourdhui: string }) {
  const { entrees, parPortion, chargement, erreur, ajouter, modifier, supprimer } = useJournal(date)
  const { profil } = useProfilNutrition()
  // null : boîte fermée ; { entree: null } : ajout d'un aliment ; { entree } : modification.
  const [dialogue, setDialogue] = useState<{ entree: EntreeJournal | null } | null>(null)

  // Totaux du jour : calculés à chaque affichage (jamais stockés).
  const total = totauxJournal(entrees, parPortion)
  const aucunObjectif = profil !== null && CLES_VALEURS.every((cle) => profil.objectifs[cle] === null)

  // Petit texte sous le nom : quantité et calories (ou « légume, non compté »).
  function detail(e: EntreeJournal): string {
    if (e.type === 'aliment' && e.aliment.legume_libre) return `${e.quantite_texte} · légume, non compté`
    if (e.type === 'recette' && !parPortion.has(e.recette_id)) return `${e.quantite_texte} · calcul…`
    return `${e.quantite_texte} · ${formaterValeur(valeursEntree(e, parPortion).kcal, 'kcal')} kcal`
  }

  const enEdition = dialogue?.entree ?? null
  const recetteEnEdition = enEdition?.type === 'recette' ? trouverRecette(enEdition.recette_id) : undefined

  return (
    <div className="page-journal">
      <header className="entete-app">
        <h1>Nutrition</h1>
      </header>

      <nav className="navigation-jours" aria-label="Changer de jour">
        <Link to={`/nutrition/${decalerJours(date, -1)}`} className="bouton" aria-label="Jour précédent">
          ←
        </Link>
        <div>
          <h2>{date === aujourdhui ? "Aujourd'hui" : formaterDateLongue(date, aujourdhui)}</h2>
          {date !== aujourdhui && <Link to="/nutrition">Revenir à aujourd'hui</Link>}
        </div>
        <Link to={`/nutrition/${decalerJours(date, 1)}`} className="bouton" aria-label="Jour suivant">
          →
        </Link>
      </nav>

      <main>
        <div className="grille-pastilles">
          {CLES_VALEURS.map((cle) => (
            <Pastille key={cle} cle={cle} valeur={total[cle]} objectif={profil?.objectifs[cle] ?? null} />
          ))}
        </div>
        {aucunObjectif && (
          <p className="note-portions">
            <Link to="/nutrition/objectifs">Définis tes objectifs</Link> pour voir ton avancement.
          </p>
        )}

        {erreur && <p className="message-erreur">{erreur}</p>}
        {chargement && <p>Chargement…</p>}
        {!chargement && entrees.length === 0 && (
          <p className="note-portions">
            Rien de consigné ce jour-là. Pour un plat, ouvre sa recette : « J'en ai mangé ».
          </p>
        )}

        {REPAS.map(({ cle, libelle }) => {
          const duRepas = entrees.filter((e) => e.repas === cle)
          if (duRepas.length === 0) return null
          return (
            <section key={cle} className="repas">
              <h3>
                {libelle} <small>{formaterValeur(totauxJournal(duRepas, parPortion).kcal, 'kcal')} kcal</small>
              </h3>
              <ul>
                {duRepas.map((e) => (
                  <li key={e.id} className="entree-journal">
                    {/* Toucher l'entrée : la modifier (quantité ou portions, repas). */}
                    <button type="button" onClick={() => setDialogue({ entree: e })}>
                      <span>
                        {e.type === 'recette' && '🍽️ '}
                        {nomEntree(e)}
                      </span>
                      <small>{detail(e)}</small>
                    </button>
                    <button
                      type="button"
                      className="bouton-supprimer"
                      aria-label={`Supprimer ${nomEntree(e)}`}
                      onClick={() => supprimer(e.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        <p className="liens-compte">
          <Link to="/nutrition/objectifs" className="bouton-discret">
            Objectifs
          </Link>
          <Link to="/nutrition/aliments" className="bouton-discret">
            Gérer les aliments
          </Link>
        </p>
        <p className="attribution">
          Source des aliments génériques : Fichier canadien sur les éléments nutritifs, Santé Canada, 2026.
          Valeurs approximatives, à titre indicatif.
        </p>
      </main>

      <button type="button" className="fab" aria-label="Ajouter un aliment" onClick={() => setDialogue({ entree: null })}>
        +
      </button>

      {/* Ajout d'un aliment, ou modification d'une entrée « aliment ». */}
      {dialogue && enEdition?.type !== 'recette' && (
        <DialogueAjoutJournal
          date={date}
          entree={enEdition}
          onAjouter={ajouter}
          onModifier={modifier}
          onFerme={() => setDialogue(null)}
        />
      )}
      {/* Modification d'une entrée « recette » (portions, repas). */}
      {enEdition?.type === 'recette' && (
        <DialogueRecetteJournal
          titre={recetteEnEdition?.titre ?? 'Recette introuvable'}
          parPortion={parPortion.get(enEdition.recette_id) ?? null}
          depart={{ portions: enEdition.portions, repas: enEdition.repas }}
          onEnregistrer={(choix) => modifier(enEdition.id, choix)}
          onFerme={() => setDialogue(null)}
        />
      )}
      <NavBar />
    </div>
  )
}
