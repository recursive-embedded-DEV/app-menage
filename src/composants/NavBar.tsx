import { NavLink } from 'react-router'
import { useOngletNutrition } from '../hooks/useOngletNutrition'

const BASE = import.meta.env.BASE_URL

// Agenda est encore une page HTML statique (dans public/) : <a> ordinaire.
// Listes et Recettes sont gérés par React : <NavLink>, qui ajoute tout seul
// la classe "active" quand l'adresse correspond (ex. /listes/epicerie).
//
// Onglet Nutrition : affiché seulement si le membre l'a activé (Mon profil).
// La valeur vient d'un cache LOCAL (data/cache-nutrition.ts), pas de Supabase :
// NavBar est sur toutes les pages, et les Recettes ne téléchargent pas Supabase.
// useOngletNutrition s'abonne à ce cache : l'onglet apparaît ou disparaît dès
// que la préférence change, sans recharger la page.
export default function NavBar() {
  const nutrition = useOngletNutrition()

  return (
    <nav className="nav-bar">
      <ul>
        <li><a href={`${BASE}agenda.html`}><span>📅</span>Agenda</a></li>
        <li><NavLink to="/listes"><span>✅</span>Listes</NavLink></li>
        <li><NavLink to="/recettes"><span>🍴</span>Recettes</NavLink></li>
        {nutrition && <li><NavLink to="/nutrition"><span>🥗</span>Nutrition</NavLink></li>}
      </ul>
    </nav>
  )
}
