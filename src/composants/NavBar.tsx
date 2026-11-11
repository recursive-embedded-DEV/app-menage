import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useOngletNutrition } from '../hooks/useOngletNutrition'

const BASE = import.meta.env.BASE_URL

// Icônes au trait (SVG inline) : stroke="currentColor" prend la couleur du
// texte du lien, donc l'onglet actif devient bleu tout seul (classe active).
// aria-hidden : décoratives, le libellé sous l'icône suffit.
function Icone({ chemin }: { chemin: ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {chemin}
    </svg>
  )
}

const ICONES = {
  agenda: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  listes: <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />,
  recettes: <path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 2-2 6 0 8v10" />,
  nutrition: <path d="M12 21c-5 0-8-4-8-9 4 0 6 2 8 5 2-3 4-5 8-5 0 5-3 9-8 9zM12 17V7" />,
}

// Agenda est encore une page HTML statique (dans public/) : <a> ordinaire.
// Listes et Recettes sont gérés par React : <NavLink>, qui ajoute tout seul
// la classe "active" quand l'adresse correspond (ex. /listes/epicerie).
//
// Onglet Nutrition : affiché seulement si le membre l'a activé (Mon profil).
// La valeur vient d'un cache LOCAL (data/cache-nutrition.ts), pas de Supabase.
// useOngletNutrition s'abonne à ce cache : l'onglet apparaît ou disparaît dès
// que la préférence change, sans recharger la page.
export default function NavBar() {
  const nutrition = useOngletNutrition()

  return (
    <nav className="nav-bar">
      <ul>
        <li>
          <a href={`${BASE}agenda.html`}>
            <Icone chemin={ICONES.agenda} />
            Agenda
          </a>
        </li>
        <li>
          <NavLink to="/listes">
            <Icone chemin={ICONES.listes} />
            Listes
          </NavLink>
        </li>
        <li>
          <NavLink to="/recettes">
            <Icone chemin={ICONES.recettes} />
            Recettes
          </NavLink>
        </li>
        {nutrition && (
          <li>
            <NavLink to="/nutrition">
              <Icone chemin={ICONES.nutrition} />
              Nutrition
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
