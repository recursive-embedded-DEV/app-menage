import { useState } from 'react'
import { Link } from 'react-router'
import NavBar from '../composants/NavBar'
import DialogueNouvelAliment from '../composants/DialogueNouvelAliment'
import { useRechercheAliments } from '../hooks/useRechercheAliments'
import type { Aliment } from '../types/aliment'
import { formaterValeur, resumeValeurs, valeursPour } from '../utils/nutrition'

// « Gérer les aliments » (#/nutrition/aliments) : recherche dans la base
// d'aliments, fiche avec les mesures, création d'aliments perso.
export default function PageAliments() {
  const [texte, setTexte] = useState('')
  const [choisi, setChoisi] = useState<Aliment | null>(null)
  const { resultats, enCours, erreur } = useRechercheAliments(texte)

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
