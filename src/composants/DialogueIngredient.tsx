import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Aliment } from '../types/aliment'
import { useRechercheAliments } from '../hooks/useRechercheAliments'
import {
  formaterValeur,
  grammesDe,
  lireNombreSaisi,
  lireQuantiteTexte,
  quantiteTexte,
  resumeValeurs,
  valeursPour,
} from '../utils/nutrition'
import type { Unite } from '../utils/nutrition'

// Ce que la boîte renvoie : de quoi créer (ou mettre à jour) une ligne
// d'ingrédient reliée à la base, avec un texte de quantité et des grammes
// TOUJOURS cohérents (calculés ensemble).
export interface ChoixIngredient {
  aliment: Aliment
  grammes: number
  quantite: string // « 3 × 1 oeuf moyen », « 150 g »
}

interface Props {
  // Modification d'une ligne déjà reliée : on part de son aliment et de sa quantité.
  depart: { aliment: Aliment; grammes: number; quantite: string } | null
  onValider: (choix: ChoixIngredient) => void
  // Ajout seulement : ajouter le texte tapé SANS aliment de la base (sel, eau…).
  onSansAliment?: (nom: string) => void
  onFerme: () => void
}

// Ajouter un ingrédient DIRECTEMENT depuis la base d'aliments :
//   1. chercher et choisir l'aliment ;
//   2. la quantité, en mesures de cuisine (« 3 × 1 oeuf moyen ») ou en grammes.
// Monté à l'ouverture, démonté à la fermeture : son état repart à zéro.
export default function DialogueIngredient({ depart, onValider, onSansAliment, onFerme }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const quantiteDepart = depart && lireQuantiteTexte(depart.quantite, depart.aliment.mesures, depart.grammes)

  const [texte, setTexte] = useState('')
  const [aliment, setAliment] = useState<Aliment | null>(depart?.aliment ?? null)
  const [nombre, setNombre] = useState(quantiteDepart ? String(quantiteDepart.nombre).replace('.', ',') : '1')
  const [unite, setUnite] = useState<Unite>(quantiteDepart?.unite ?? { type: 'g' })
  const { resultats, enCours } = useRechercheAliments(texte)

  useEffect(() => {
    dialogue.current?.showModal()
  }, [])

  // Unité proposée : la 1re mesure de cuisine de l'aliment, sinon 100 g.
  function choisir(a: Aliment) {
    setAliment(a)
    const [mesure] = a.mesures
    setNombre(mesure ? '1' : '100')
    setUnite(mesure ? { type: 'mesure', mesure } : { type: 'g' })
  }

  const n = lireNombreSaisi(nombre)
  const grammes = aliment && n > 0 ? Math.round(grammesDe(n, unite) * 10) / 10 : 0

  function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // La boîte s'ouvre depuis le formulaire de la recette : sans ceci, l'envoi
    // REMONTERAIT jusqu'à lui (les événements React suivent l'arbre des
    // composants, même à travers un portail) et enregistrerait la recette.
    e.stopPropagation()
    if (!aliment || !(grammes > 0)) return
    onValider({ aliment, grammes, quantite: quantiteTexte(n, unite) })
    dialogue.current?.close() // onClose → onFerme → démontage
  }

  // createPortal : la boîte est placée dans <body>, HORS du <form> de la recette.
  // Un <form> dans un autre <form> est du HTML invalide : le bouton d'envoi se
  // comportait de façon imprévisible (le bouton « Ajouter » ne réagissait pas).
  return createPortal(
    <dialog id="dialogue-ingredient" className="dialogue" ref={dialogue} onClose={onFerme}>
      <form className="formulaire" onSubmit={soumettre}>
        <h2>{depart ? 'Modifier la quantité' : 'Ajouter un ingrédient'}</h2>

        {!aliment ? (
          <>
            <input
              type="search"
              className="champ-recherche"
              placeholder="Ingrédient : oeuf, riz, sel…"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              autoFocus
            />
            {enCours && <p className="note-portions">Recherche…</p>}
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
            {/* Pas dans la base (sel, eau, « légumes au choix »…) : on l'ajoute
                quand même, sans valeur nutritive. */}
            {onSansAliment && texte.trim() && (
              <button
                type="button"
                className="bouton-discret"
                onClick={() => {
                  onSansAliment(texte.trim())
                  dialogue.current?.close()
                }}
              >
                + Ajouter « {texte.trim()} » sans aliment de la base
              </button>
            )}
          </>
        ) : (
          <>
            <p className="aliment-choisi">
              <strong>{aliment.nom}</strong>
              {!depart && (
                <button type="button" className="bouton-discret" onClick={() => setAliment(null)}>
                  Changer
                </button>
              )}
            </p>
            <div className="grille-valeurs">
              <label>
                Quantité
                <input type="text" inputMode="decimal" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </label>
              <label>
                Unité
                <select
                  value={unite.type === 'g' ? 'g' : `m${aliment.mesures.indexOf(unite.mesure)}`}
                  onChange={(e) => {
                    const v = e.target.value
                    setUnite(v === 'g' ? { type: 'g' } : { type: 'mesure', mesure: aliment.mesures[Number(v.slice(1))] })
                  }}
                >
                  {aliment.mesures.map((m, i) => (
                    <option key={m.nom} value={`m${i}`}>
                      {m.nom} ({formaterValeur(m.g, 'proteines_g')} g)
                    </option>
                  ))}
                  <option value="g">grammes</option>
                </select>
              </label>
            </div>
            {grammes > 0 && (
              <p className="note-portions">
                {quantiteTexte(n, unite)} = {formaterValeur(grammes, 'proteines_g')} g :{' '}
                {aliment.legume_libre ? 'légume, non compté' : resumeValeurs(valeursPour(aliment, grammes))}
              </p>
            )}
          </>
        )}

        <div className="dialogue-actions">
          <button type="button" className="bouton" onClick={() => dialogue.current?.close()}>
            Annuler
          </button>
          {aliment && (
            <button type="submit" className="bouton" disabled={!(grammes > 0)}>
              {depart ? 'Enregistrer' : 'Ajouter'}
            </button>
          )}
        </div>
      </form>
    </dialog>,
    document.body,
  )
}
