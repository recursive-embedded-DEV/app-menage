import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router'
import BanniereMiseAJour from './composants/BanniereMiseAJour'

// DÉCOUPAGE DU CODE : chaque page est un fichier JavaScript séparé, téléchargé
// seulement quand on la visite. import() dynamique = point de découpe pour Vite.
// RouteProtegee aussi : il importe la connexion, donc tout supabase-js ; importé
// normalement, il ferait entrer Supabase dans le fichier principal.
const ListeRecettes = lazy(() => import('./pages/ListeRecettes'))
const PageRecette = lazy(() => import('./pages/PageRecette'))
const ListesAccueil = lazy(() => import('./pages/ListesAccueil'))
const PageListe = lazy(() => import('./pages/PageListe'))
const RouteProtegee = lazy(() => import('./composants/RouteProtegee'))
const PageAliments = lazy(() => import('./pages/PageAliments'))
const PageJournal = lazy(() => import('./pages/PageJournal'))
const PageObjectifs = lazy(() => import('./pages/PageObjectifs'))
const PageProfil = lazy(() => import('./pages/PageProfil'))

// Le « standard » de l'app : quelle adresse affiche quelle page.
// HashRouter met la route après un # (ex. index.html#/listes/epicerie),
// ce qui évite les erreurs 404 sur GitHub Pages quand on rafraîchit.
export default function App() {
  return (
    <HashRouter>
      {/* Hors des <Routes> : visible sur toutes les pages. */}
      <BanniereMiseAJour />
      {/* Affiché pendant le téléchargement d'une page (une fraction de seconde ;
          instantané une fois l'app installée, car tout est pré-caché). */}
      <Suspense fallback={<p className="chargement-page">Chargement…</p>}>
      <Routes>
        <Route path="/" element={<Navigate to="/listes" replace />} />
        {/* Listes : réservées aux membres du ménage connectés */}
        <Route path="/listes" element={<RouteProtegee><ListesAccueil /></RouteProtegee>} />
        <Route path="/listes/:id" element={<RouteProtegee><PageListe /></RouteProtegee>} />
        <Route path="/profil" element={<RouteProtegee><PageProfil /></RouteProtegee>} />
        {/* Nutrition : privé, onglet affiché sur option (Mon profil). React Router
            préfère les routes fixes (aliments, objectifs) à la route variable :date. */}
        <Route path="/nutrition" element={<RouteProtegee><PageJournal /></RouteProtegee>} />
        <Route path="/nutrition/aliments" element={<RouteProtegee><PageAliments /></RouteProtegee>} />
        <Route path="/nutrition/objectifs" element={<RouteProtegee><PageObjectifs /></RouteProtegee>} />
        <Route path="/nutrition/:date" element={<RouteProtegee><PageJournal /></RouteProtegee>} />
        <Route path="/recettes" element={<ListeRecettes />} />
        <Route path="/recettes/:id" element={<PageRecette />} />
        {/* Toute autre adresse : retour aux listes */}
        <Route path="*" element={<Navigate to="/listes" replace />} />
      </Routes>
      </Suspense>
    </HashRouter>
  )
}
