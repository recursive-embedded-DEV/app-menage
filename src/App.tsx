import { HashRouter, Routes, Route, Navigate } from 'react-router'
import ListeRecettes from './pages/ListeRecettes'
import PageRecette from './pages/PageRecette'

// Le « standard » de l'app : quelle adresse affiche quelle page.
// HashRouter met la route après un # (ex. index.html#/recettes/banh-mi),
// ce qui évite les erreurs 404 sur GitHub Pages quand on rafraîchit.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/recettes" replace />} />
        <Route path="/recettes" element={<ListeRecettes />} />
        <Route path="/recettes/:id" element={<PageRecette />} />
        {/* Toute autre adresse : retour à la liste */}
        <Route path="*" element={<Navigate to="/recettes" replace />} />
      </Routes>
    </HashRouter>
  )
}
