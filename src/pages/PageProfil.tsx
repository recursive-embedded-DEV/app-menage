import { useState } from 'react'
import { Link } from 'react-router'
import BarreHaut from '../composants/BarreHaut'
import NavBar from '../composants/NavBar'
import { useProfilNutrition } from '../hooks/useProfilNutrition'

// Préférences du membre connecté. Pour l'instant : l'onglet Nutrition,
// que chacun choisit d'afficher ou non.
export default function PageProfil() {
  const { profil, erreur, enregistrer } = useProfilNutrition()
  const [enCours, setEnCours] = useState(false)
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null)

  async function basculer(actif: boolean) {
    if (!profil) return
    setEnCours(true)
    setErreurEnregistrement(null)
    try {
      await enregistrer({ ...profil, actif })
    } catch {
      setErreurEnregistrement("Le changement n'a pas été enregistré. Vérifie ta connexion.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="page-profil">
      <BarreHaut repli="/listes" />
      <header className="entete-app">
        <h1>Mon profil</h1>
      </header>
      <main>
        {erreur && <p className="message-erreur">{erreur}</p>}
        {!profil && !erreur && <p>Chargement…</p>}
        {profil && (
          <>
            <label className="interrupteur">
              <input
                type="checkbox"
                checked={profil.actif}
                disabled={enCours}
                onChange={(e) => basculer(e.target.checked)}
              />
              <span>
                <strong>Afficher l'onglet Nutrition</strong>
                <small>Journal alimentaire et objectifs (calories, protéines, glucides, lipides). Privé : toi seul le vois.</small>
              </span>
            </label>
            {erreurEnregistrement && <p className="message-erreur">{erreurEnregistrement}</p>}
            {profil.actif && (
              <p className="note-portions">
                L'onglet 🥗 Nutrition est dans la barre du bas.{' '}
                <Link to="/nutrition/objectifs">Définir mes objectifs</Link>
              </p>
            )}
          </>
        )}
      </main>
      <NavBar />
    </div>
  )
}
