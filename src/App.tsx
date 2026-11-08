import { HashRouter, Routes, Route, Navigate } from 'react-router'
import ListeRecettes from './pages/ListeRecettes'
import PageRecette from './pages/PageRecette'
import ListesAccueil from './pages/ListesAccueil'
import PageListe from './pages/PageListe'

// Le « standard » de l'app : quelle adresse affiche quelle page.
// HashRouter met la route après un # (ex. index.html#/listes/epicerie),
// ce qui évite les erreurs 404 sur GitHub Pages quand on rafraîchit.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/listes" replace />} />
        <Route path="/listes" element={<ListesAccueil />} />
        <Route path="/listes/:id" element={<PageListe />} />
        <Route path="/recettes" element={<ListeRecettes />} />
        <Route path="/recettes/:id" element={<PageRecette />} />
        {/* Toute autre adresse : retour aux listes */}
        <Route path="*" element={<Navigate to="/listes" replace />} />
      </Routes>
    </HashRouter>
  )
}
