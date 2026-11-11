import type { ReactNode } from 'react'

// Icônes au trait (SVG inline), toutes du même style : trait de 2 px, bouts
// arrondis, dessinées sur une grille de 24 × 24. Les dessins sont dans
// dessins.tsx (fichier à part : ESLint veut qu'un fichier de composants
// n'exporte QUE des composants, pour le rechargement à chaud de Vite).
// stroke="currentColor" : l'icône prend la couleur du texte de son parent
// (ex. l'onglet actif de la barre de navigation devient bleu tout seul).
// aria-hidden : décoratives ; c'est le lien ou le bouton qui porte le nom
// (libellé visible ou aria-label).
export function Icone({ dessin, taille = 22 }: { dessin: ReactNode; taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dessin}
    </svg>
  )
}
