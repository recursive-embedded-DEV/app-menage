import { NavLink } from 'react-router'
import { useOngletNutrition } from '../hooks/useOngletNutrition'
import { DESSINS } from './dessins'
import { Icone } from './Icones'

// Toutes les pages sont gérées par React : <NavLink> ajoute tout seul la
// classe "active" quand l'adresse correspond (ex. /listes/epicerie).
// Les icônes (composants/Icones.tsx) prennent la couleur du lien : l'onglet
// actif devient bleu tout seul. Le libellé sous l'icône lui donne son nom.
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
          <NavLink to="/agenda">
            <Icone dessin={DESSINS.agenda} />
            Agenda
          </NavLink>
        </li>
        <li>
          <NavLink to="/listes">
            <Icone dessin={DESSINS.listes} />
            Listes
          </NavLink>
        </li>
        <li>
          <NavLink to="/recettes">
            <Icone dessin={DESSINS.recettes} />
            Recettes
          </NavLink>
        </li>
        {nutrition && (
          <li>
            <NavLink to="/nutrition">
              <Icone dessin={DESSINS.nutrition} />
              Nutrition
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
