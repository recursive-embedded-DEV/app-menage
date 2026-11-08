import type { Liste } from '../types/liste'

// Contenu de départ, utilisé seulement la toute première fois
// (quand rien n'est encore enregistré dans le navigateur).
// C'est un fichier .ts plutôt que .json pour que TypeScript vérifie
// chaque champ, y compris la valeur de `type`.
export const listesInitiales: Liste[] = [
  {
    id: 'epicerie',
    titre: 'Épicerie',
    type: 'articles',
    articles: [
      { id: 'lait', texte: 'Lait', coche: false },
      { id: 'pain', texte: 'Pain', coche: false },
      { id: 'oeufs', texte: 'Œufs', coche: false },
      { id: 'cafe', texte: 'Café', coche: false },
    ],
  },
  {
    id: 'livres',
    titre: 'Livres à lire',
    type: 'livres',
    livres: [
      { id: 'hidden-potential', titre: 'Hidden Potential', auteur: 'Adam Grant', lien: 'https://www.amazon.ca/dp/0593653661', isbn: '0593653661', image: 'hidden-potential.jpg' },
      { id: 'turn-ship-around', titre: 'Turn the Ship Around!', auteur: 'L. David Marquet', lien: 'https://www.amazon.ca/dp/0241250943', isbn: '0241250943', image: 'turn-ship-around.jpg' },
      { id: 'psychology-money', titre: 'The Psychology of Money', auteur: 'Morgan Housel', lien: 'https://www.amazon.ca/dp/0857197681', isbn: '0857197681', image: 'psychology-money.jpg' },
      { id: 'indistractable', titre: 'Indistractable', auteur: 'Nir Eyal', lien: 'https://www.amazon.ca/dp/1637747829', isbn: '1637747829', image: 'indistractable.jpg' },
      { id: 'four-thousand-weeks', titre: 'Four Thousand Weeks', auteur: 'Oliver Burkeman', lien: 'https://www.amazon.ca/dp/0735232482', isbn: '0735232482', image: 'four-thousand-weeks.jpg' },
      { id: 'how-innovation-works', titre: 'How Innovation Works', auteur: 'Matt Ridley', lien: 'https://www.amazon.ca/dp/0062916602', isbn: '0062916602', image: 'how-innovation-works.jpg' },
      { id: 'bulletproof-problem-solving', titre: 'Bulletproof Problem Solving', auteur: 'Charles Conn et Robert McLean', lien: '', isbn: '', image: 'bulletproof-problem-solving.jpg' },
    ],
  },
]
