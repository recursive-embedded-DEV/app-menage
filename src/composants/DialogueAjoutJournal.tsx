import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Aliment } from '../types/aliment'
import type { ChangementsEntree, EntreeAliment, NouvelleEntree, Repas } from '../types/journal'
import { alimentsRecents } from '../data/journal'
import { useRechercheAliments } from '../hooks/useRechercheAliments'
import { heureLocale } from '../utils/dates'
import {
  REPAS,
  formaterValeur,
  grammesDe,
  lireNombreSaisi,
  lireQuantiteTexte,
  quantiteTexte,
  repasParDefaut,
  resumeValeurs,
  valeursPour,
} from '../utils/nutrition'
import type { Unite } from '../utils/nutrition'

interface Props {
  date: string
  entree: EntreeAliment | null // null : ajout ; sinon : modification de cette entrée (un aliment)
  onAjouter: (nouvelle: NouvelleEntree) => Promise<boolean>
  onModifier: (id: string, changements: ChangementsEntree) => Promise<boolean>
  onFerme: () => void
}

// Unité proposée en choisissant un aliment : sa 1re mesure de cuisine
// (« 1 oeuf moyen ») si elle existe, sinon 100 g.
function uniteParDefaut(aliment: Aliment): { nombre: string; unite: Unite } {
  const [mesure] = aliment.mesures
  return mesure ? { nombre: '1', unite: { type: 'mesure', mesure } } : { nombre: '100', unite: { type: 'g' } }
}

// Valeur du menu des unités : « g » ou « m0 », « m1 »… (position de la mesure).
const valeurUnite = (unite: Unite, aliment: Aliment) =>
  unite.type === 'g' ? 'g' : `m${aliment.mesures.indexOf(unite.mesure)}`

// Ajout (ou modification) d'un aliment dans le journal :
//   1. choisir l'aliment (Récents, ou recherche) ;
//   2. quantité (mesures ou grammes) et repas, avec un aperçu des valeurs.
// Le composant est MONTÉ à l'ouverture et démonté à la fermeture : son état
// repart toujours à zéro.
export default function DialogueAjoutJournal({ date, entree, onAjouter, onModifier, onFerme }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const depart = entree ? lireQuantiteTexte(entree.quantite_texte, entree.aliment.mesures, entree.grammes) : null

  const [texte, setTexte] = useState('')
  const [recents, setRecents] = useState<Aliment[]>([])
  const [aliment, setAliment] = useState<Aliment | null>(entree?.aliment ?? null)
  const [nombre, setNombre] = useState(depart ? String(depart.nombre).replace('.', ',') : '1')
  const [unite, setUnite] = useState<Unite>(depart?.unite ?? { type: 'g' })
  const [repas, setRepas] = useState<Repas>(entree?.repas ?? repasParDefaut(heureLocale()))
  const [enCours, setEnCours] = useState(false)
  const { resultats, enCours: rechercheEnCours } = useRechercheAliments(texte)

  // Ouverture au montage (showModal n'a pas d'équivalent déclaratif en React).
  useEffect(() => {
    dialogue.current?.showModal()
  }, [])

  // Récents : seulement à l'ajout. Une erreur ici n'est pas grave (la
  // recherche reste possible) : on l'ignore.
  useEffect(() => {
    if (entree) return
    alimentsRecents()
      .then(setRecents)
      .catch(() => {})
  }, [entree])

  function choisir(a: Aliment) {
    const defaut = uniteParDefaut(a)
    setAliment(a)
    setNombre(defaut.nombre)
    setUnite(defaut.unite)
  }

  const quantite = lireNombreSaisi(nombre)
  const grammes = aliment && quantite > 0 ? grammesDe(quantite, unite) : 0
  const apercu = aliment && grammes > 0 ? valeursPour(aliment, grammes) : null

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!aliment || !(grammes > 0)) return
    const changements = { repas, grammes, quantite_texte: quantiteTexte(quantite, unite) }
    setEnCours(true)
    const reussi = entree
      ? await onModifier(entree.id, changements)
      : await onAjouter({ date, aliment_id: aliment.id, ...changements })
    setEnCours(false)
    if (reussi) dialogue.current?.close() // onClose → onFerme → démontage
  }

  const listeAffichee = texte.trim().length >= 2 ? resultats : recents

  return (
    <dialog id="dialogue-journal" className="dialogue" ref={dialogue} onClose={onFerme}>
      <form className="formulaire" onSubmit={soumettre}>
        <h2>{entree ? 'Modifier' : 'Ajouter un aliment'}</h2>

        {!aliment ? (
          // Étape 1 : choisir l'aliment.
          <>
            <input
              type="search"
              className="champ-recherche"
              placeholder="Rechercher : riz, oeuf, poulet…"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              autoFocus
            />
            {texte.trim().length < 2 && recents.length > 0 && <p className="note-portions">Récents</p>}
            {rechercheEnCours && <p className="note-portions">Recherche…</p>}
            <ul className="resultats-aliments">
              {listeAffichee.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => choisir(a)}>
                    <span>{a.nom}</span>
                    <small>
                      {a.source === 'perso' ? '★ ' : ''}
                      {a.legume_libre ? 'légume, non compté' : `${formaterValeur(a.kcal, 'kcal')} kcal / 100 g`}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          // Étape 2 : quantité et repas.
          <>
            <p className="aliment-choisi">
              <strong>{aliment.nom}</strong>
              {!entree && (
                <button type="button" className="bouton-discret" onClick={() => setAliment(null)}>
                  Changer
                </button>
              )}
            </p>
            <div className="grille-valeurs">
              <label>
                Quantité
                <input
                  type="text"
                  inputMode="decimal"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </label>
              <label>
                Unité
                <select
                  value={valeurUnite(unite, aliment)}
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
            <label>
              Repas
              <select value={repas} onChange={(e) => setRepas(e.target.value as Repas)}>
                {REPAS.map((r) => (
                  <option key={r.cle} value={r.cle}>
                    {r.libelle}
                  </option>
                ))}
              </select>
            </label>
            {apercu && (
              <p className="note-portions">
                {formaterValeur(grammes, 'proteines_g')} g :{' '}
                {aliment.legume_libre ? 'légume, non compté dans les totaux' : resumeValeurs(apercu)}
              </p>
            )}
          </>
        )}

        <div className="dialogue-actions">
          <button type="button" className="bouton" onClick={() => dialogue.current?.close()}>
            Annuler
          </button>
          {aliment && (
            <button type="submit" className="bouton" disabled={enCours || !(grammes > 0)}>
              {enCours ? 'Envoi…' : entree ? 'Enregistrer' : 'Ajouter'}
            </button>
          )}
        </div>
      </form>
    </dialog>
  )
}
