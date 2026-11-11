// Tracés des icônes (à passer à <Icone dessin={…} />), sur une grille 24 × 24.
export const DESSINS = {
  // Barre de navigation
  agenda: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  listes: <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />,
  recettes: <path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 2-2 6 0 8v10" />,
  nutrition: <path d="M12 21c-5 0-8-4-8-9 4 0 6 2 8 5 2-3 4-5 8-5 0 5-3 9-8 9zM12 17V7" />,
  // Barre du haut et cartes
  retour: <path d="M15 5l-7 7 7 7" />, // chevron ‹
  fermer: <path d="M6 6l12 12M18 6L6 18" />, // croix ✕
  modifier: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />, // crayon
}
