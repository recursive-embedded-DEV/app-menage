import { NavLink } from 'react-router'

const BASE = import.meta.env.BASE_URL

// Agenda est encore une page HTML statique (dans public/) : <a> ordinaire.
// Listes et Recettes sont gérés par React : <NavLink>, qui ajoute tout seul
// la classe "active" quand l'adresse correspond (ex. /listes/epicerie).
export default function NavBar() {
  return (
    <nav className="nav-bar">
      <ul>
        <li><a href={`${BASE}agenda.html`}><span>📅</span>Agenda</a></li>
        <li><NavLink to="/listes"><span>✅</span>Listes</NavLink></li>
        <li><NavLink to="/recettes"><span>🍴</span>Recettes</NavLink></li>
      </ul>
    </nav>
  )
}
