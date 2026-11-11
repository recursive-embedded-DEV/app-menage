import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import NavBar from '../composants/NavBar'
import { useProfilNutrition } from '../hooks/useProfilNutrition'
import type { Objectifs, ProfilNutrition } from '../types/journal'
import { lireNombreSaisi } from '../utils/nutrition'

const CHAMPS: { cle: keyof Objectifs; libelle: string; aide: string }[] = [
  { cle: 'kcal', libelle: 'Calories (kcal)', aide: 'maximum' },
  { cle: 'proteines_g', libelle: 'Protéines (g)', aide: 'minimum' },
  { cle: 'glucides_g', libelle: 'Glucides (g)', aide: 'maximum' },
  { cle: 'lipides_g', libelle: 'Lipides (g)', aide: 'maximum' },
]

export default function PageObjectifs() {
  const { profil, erreur, enregistrer } = useProfilNutrition()

  return (
    <div className="page-objectifs">
      <nav className="barre-retour">
        <Link to="/nutrition" className="bouton">← Journal</Link>
      </nav>
      <header className="entete-app">
        <h1>Mes objectifs</h1>
      </header>
      <main>
        <p className="note-portions">
          Les <strong>protéines</strong> sont un <strong>minimum</strong> à atteindre ; les calories, glucides et
          lipides, un <strong>maximum</strong> à ne pas dépasser. Laisse un champ vide pour ne pas suivre cette valeur.
        </p>
        {erreur && <p className="message-erreur">{erreur}</p>}
        {/* Le formulaire n'apparaît qu'une fois le profil chargé : ses champs
            partent ainsi des bonnes valeurs. */}
        {profil ? <FormulaireObjectifs profil={profil} enregistrer={enregistrer} /> : !erreur && <p>Chargement…</p>}
      </main>
      <NavBar />
    </div>
  )
}

interface PropsFormulaire {
  profil: ProfilNutrition
  enregistrer: (profil: ProfilNutrition) => Promise<void>
}

function FormulaireObjectifs({ profil, enregistrer }: PropsFormulaire) {
  const naviguer = useNavigate()
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const donnees = new FormData(e.currentTarget)
    const objectifs = { ...profil.objectifs }
    for (const { cle } of CHAMPS) {
      const texte = String(donnees.get(cle) ?? '').trim()
      if (texte === '') {
        objectifs[cle] = null
        continue
      }
      const n = lireNombreSaisi(texte)
      if (!(n > 0)) {
        setErreur('Chaque objectif doit être un nombre plus grand que 0 (ou rester vide).')
        return
      }
      objectifs[cle] = n
    }

    setEnCours(true)
    setErreur(null)
    try {
      await enregistrer({ ...profil, objectifs })
      naviguer('/nutrition')
    } catch {
      setErreur("Les objectifs n'ont pas été enregistrés. Vérifie ta connexion.")
      setEnCours(false)
    }
  }

  return (
    <form className="formulaire" onSubmit={soumettre}>
      {CHAMPS.map(({ cle, libelle, aide }) => (
        <label key={cle}>
          <span>
            {libelle} <small>({aide})</small>
          </span>
          <input
            type="text"
            name={cle}
            inputMode="decimal"
            defaultValue={profil.objectifs[cle] === null ? '' : String(profil.objectifs[cle]).replace('.', ',')}
          />
        </label>
      ))}
      {erreur && <p className="message-erreur">{erreur}</p>}
      <button type="submit" className="bouton bouton-liste" disabled={enCours}>
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
