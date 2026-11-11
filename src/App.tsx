import { HashRouter, Routes, Route, Navigate } from 'react-router'
import ListeRecettes from './pages/ListeRecettes'
import PageRecette from './pages/PageRecette'
import ListesAccueil from './pages/ListesAccueil'
import PageListe from './pages/PageListe'
import RouteProtegee from './composants/RouteProtegee'

// Le « standard » de l'app : quelle adresse affiche quelle page.
// HashRouter met la route après un # (ex. index.html#/listes/epicerie),
// ce qui évite les erreurs 404 sur GitHub Pages quand on rafraîchit.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/listes" replace />} />
        {/* Listes : réservées aux membres du ménage connectés */}
        <Route path="/listes" element={<RouteProtegee><ListesAccueil /></RouteProtegee>} />
        <Route path="/listes/:id" element={<RouteProtegee><PageListe /></RouteProtegee>} />
        <Route path="/recettes" element={<ListeRecettes />} />
        <Route path="/recettes/:id" element={<PageRecette />} />
        {/* Toute autre adresse : retour aux listes */}
        <Route path="*" element={<Navigate to="/listes" replace />} />
      </Routes>
    </HashRouter>
  )
}
