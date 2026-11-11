import { useState } from 'react'
import NavBar from '../composants/NavBar'
import DialogueNouvelAliment from '../composants/DialogueNouvelAliment'
import { useRechercheAliments } from '../hooks/useRechercheAliments'
import type { Aliment, Valeurs } from '../types/aliment'
import { CLES_VALEURS, formaterValeur, valeursPour } from '../utils/nutrition'

// Libellés courts des 4 valeurs, dans l'ordre de CLES_VALEURS.
const LIBELLES: Record<keyof Valeurs, string> = {
  kcal: 'kcal',
  proteines_g: 'prot.',
  glucides_g: 'gluc.',
  lipides_g: 'lip.',
}

// « 69 kcal · 5,6 g prot. · 0,4 g gluc. · 4,8 g lip. »
function resumeValeurs(v: Valeurs): string {
  return CLES_VALEURS.map((cle) =>
    cle === 'kcal' ? `${formaterValeur(v.kcal, 'kcal')} kcal` : `${formaterValeur(v[cle], cle)} g ${LIBELLES[cle]}`,
  ).join(' · ')
}

// Page de TEST de la Phase A (#/nutrition/aliments, absente de la barre de
// navigation) : recherche dans la base d'aliments et création d'aliments perso.
// Elle deviendra un écran de l'onglet Nutrition à la Phase B.
export default function PageAliments() {
  const [texte, setTexte] = useState('')
  const [choisi, setChoisi] = useState<Aliment | null>(null)
  const { resultats, enCours, erreur } = useRechercheAliments(texte)

  return (
    <div className="page-aliments">
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
            <p className="note-portions">{choisi.source === 'perso' ? 'Aliment du ménage' : choisi.groupe}</p>
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
          </section>
        )}

        <ul className="resultats-aliments">
          {resultats.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setChoisi(a)}>
                <span>{a.nom}</span>
                <small>
                  {a.source === 'perso' ? '★ ' : ''}
                  {formaterValeur(a.kcal, 'kcal')} kcal / 100 g
                </small>
              </button>
            </li>
          ))}
        </ul>

        <DialogueNouvelAliment onCree={(a) => setChoisi(a)} />

        {/* Exigence de la Licence du gouvernement ouvert – Canada : citer la source. */}
        <p className="attribution">
          Source des aliments génériques : Fichier canadien sur les éléments nutritifs, Santé Canada, 2026.
          Valeurs approximatives, à titre indicatif.
        </p>
      </main>
      <NavBar />
    </div>
  )
}
