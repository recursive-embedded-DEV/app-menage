import { useState } from 'react'
import type { GroupeIngredients, LigneIngredient } from '../utils/edition-recette'
import { ligneVide } from '../utils/edition-recette'
import { formaterValeur } from '../utils/nutrition'
import DialogueIngredient from './DialogueIngredient'
import type { ChoixIngredient } from './DialogueIngredient'

interface Props {
  groupes: GroupeIngredients[]
  onChange: (groupes: GroupeIngredients[]) => void
}

// Éditeur des ingrédients d'une recette : groupes (sections) et lignes.
//   - « + Ajouter un ingrédient » (UN seul bouton) : on cherche dans la base,
//     on choisit l'aliment et sa quantité ; la ligne est créée d'un coup (nom,
//     quantité en texte, grammes). Ce qui n'est pas dans la base (sel, eau…)
//     s'ajoute depuis la même boîte, « sans aliment ».
//   - Ligne reliée : la quantité se change en rouvrant la boîte, jamais à la
//     main ; le texte affiché et les grammes restent ainsi cohérents.
//   - Ligne sans aliment (recettes migrées) : « Relier à la base » agit sur
//     CETTE ligne (elle garde son nom).
// Composant « contrôlé » : chaque action produit un NOUVEAU tableau.
export default function EditeurIngredients({ groupes, onChange }: Props) {
  // Boîte ouverte : ajout dans un groupe (ligne null) ou une ligne précise.
  const [dialogue, setDialogue] = useState<{ groupe: string; ligne: LigneIngredient | null } | null>(null)

  const modifierGroupe = (cle: string, f: (g: GroupeIngredients) => GroupeIngredients) =>
    onChange(groupes.map((g) => (g.cle === cle ? f(g) : g)))

  const modifierLigne = (groupe: string, ligne: string, champs: Partial<LigneIngredient>) =>
    modifierGroupe(groupe, (g) => ({ ...g, lignes: g.lignes.map((l) => (l.cle === ligne ? { ...l, ...champs } : l)) }))

  // Monter (-1) ou descendre (+1) une ligne dans son groupe.
  const deplacer = (groupe: string, index: number, sens: -1 | 1) =>
    modifierGroupe(groupe, (g) => {
      const cible = index + sens
      if (cible < 0 || cible >= g.lignes.length) return g
      const lignes = [...g.lignes]
      ;[lignes[index], lignes[cible]] = [lignes[cible], lignes[index]]
      return { ...g, lignes }
    })

  // Ajoute une ligne à la fin du groupe. Le groupe vide de départ contient une
  // ligne vide : on la remplace.
  const ajouterLigne = (groupe: string, ligne: LigneIngredient) =>
    modifierGroupe(groupe, (g) => ({ ...g, lignes: [...g.lignes.filter((l) => l.nom.trim() || l.aliment), ligne] }))

  function valider(choix: ChoixIngredient) {
    if (!dialogue) return
    const { groupe, ligne } = dialogue
    if (ligne) {
      // Ligne existante : on garde le nom choisi par l'utilisateur.
      modifierLigne(groupe, ligne.cle, choix)
    } else {
      // Nouvelle ligne : le nom de l'aliment, modifiable ensuite (« Oeuf, poule… » → « Oeufs »).
      ajouterLigne(groupe, { ...ligneVide(), nom: choix.aliment.nom, ...choix })
    }
  }

  return (
    <>
      {groupes.map((g) => (
        <fieldset key={g.cle} className="groupe-edition">
          <label>
            Section <small>(facultatif : « Pour la vinaigrette »)</small>
            <input type="text" value={g.section} onChange={(e) => modifierGroupe(g.cle, (x) => ({ ...x, section: e.target.value }))} />
          </label>

          {g.lignes.map((l, i) => (
            <div key={l.cle} className="ligne-ingredient">
              {l.aliment && l.grammes ? (
                // Ligne reliée à la base : nom modifiable, quantité via la boîte.
                <>
                  <input
                    type="text"
                    aria-label="Nom affiché"
                    value={l.nom}
                    onChange={(e) => modifierLigne(g.cle, l.cle, { nom: e.target.value })}
                  />
                  <button type="button" className="quantite-reliee" onClick={() => setDialogue({ groupe: g.cle, ligne: l })}>
                    {l.quantite || 'Quantité'} · {formaterValeur(l.grammes, 'proteines_g')} g ✏️
                  </button>
                </>
              ) : (
                // Ingrédient libre : nom et quantité tapés à la main.
                <div className="grille-ingredient">
                  <input
                    type="text"
                    aria-label="Ingrédient"
                    placeholder="Ingrédient"
                    value={l.nom}
                    onChange={(e) => modifierLigne(g.cle, l.cle, { nom: e.target.value })}
                  />
                  <input
                    type="text"
                    aria-label="Quantité"
                    placeholder="Quantité"
                    value={l.quantite}
                    onChange={(e) => modifierLigne(g.cle, l.cle, { quantite: e.target.value })}
                  />
                </div>
              )}

              <div className="actions-ingredient">
                {l.aliment ? (
                  <span className="note-portions">🔗 {l.aliment.nom}</span>
                ) : (
                  <button type="button" className="bouton-discret" onClick={() => setDialogue({ groupe: g.cle, ligne: l })}>
                    🔗 Relier à la base
                  </button>
                )}
                <span className="deplacement">
                  <button type="button" className="bouton-discret" aria-label="Monter" disabled={i === 0} onClick={() => deplacer(g.cle, i, -1)}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="bouton-discret"
                    aria-label="Descendre"
                    disabled={i === g.lignes.length - 1}
                    onClick={() => deplacer(g.cle, i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="bouton-supprimer"
                    aria-label={`Retirer ${l.nom || 'la ligne'}`}
                    onClick={() => modifierGroupe(g.cle, (x) => ({ ...x, lignes: x.lignes.filter((y) => y.cle !== l.cle) }))}
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
          ))}

          <div className="ajouts-ingredient">
            <button type="button" className="bouton" onClick={() => setDialogue({ groupe: g.cle, ligne: null })}>
              + Ajouter un ingrédient
            </button>
            {groupes.length > 1 && (
              <button type="button" className="bouton-discret" onClick={() => onChange(groupes.filter((x) => x.cle !== g.cle))}>
                Retirer la section
              </button>
            )}
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        className="bouton-discret"
        onClick={() => onChange([...groupes, { cle: crypto.randomUUID(), section: '', lignes: [] }])}
      >
        + Nouvelle section d'ingrédients
      </button>

      {dialogue && (
        <DialogueIngredient
          // Ligne déjà reliée : on modifie sa quantité. Sinon : recherche.
          depart={
            dialogue.ligne?.aliment && dialogue.ligne.grammes
              ? { aliment: dialogue.ligne.aliment, grammes: dialogue.ligne.grammes, quantite: dialogue.ligne.quantite }
              : null
          }
          onValider={valider}
          // Ajout seulement (pas pour relier une ligne existante).
          onSansAliment={
            dialogue.ligne
              ? undefined
              : (nom) => ajouterLigne(dialogue.groupe, { ...ligneVide(), nom })
          }
          onFerme={() => setDialogue(null)}
        />
      )}
    </>
  )
}
