import { Link } from 'react-router'

const BASE = import.meta.env.BASE_URL

// Agenda et Listes sont encore des pages HTML statiques (dans public/) :
// on y va avec un <a> ordinaire. Recettes est géré par React : <Link>.
export default function NavBar() {
  return (
    <nav className="nav-bar">
      <ul>
        <li><a href={`${BASE}agenda.html`}><span>📅</span>Agenda</a></li>
        <li><a href={`${BASE}listes.html`}><span>✅</span>Listes</a></li>
        <li><Link to="/recettes" className="active"><span>🍴</span>Recettes</Link></li>
      </ul>
    </nav>
  )
}
