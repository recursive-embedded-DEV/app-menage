// Types du module Listes.
//
// Une liste est SOIT une liste d'articles à cocher (épicerie, tâches…),
// SOIT une liste de livres. Le champ `type` permet de savoir laquelle :
// c'est ce qu'on appelle une « union discriminée ». Quand le code teste
// `liste.type === 'articles'`, TypeScript sait que `liste.articles` existe.

export interface Article {
  id: string;
  texte: string;
  coche: boolean;
}

export interface Livre {
  id: string;
  titre: string;
  auteur: string;
  lien: string;  // lien Amazon ; "" si aucun
  isbn: string;  // chiffres seulement ; "" si inconnu
  image: string; // fichier dans public/img/ ; "" → couverture Open Library
}

export interface ListeArticles {
  id: string;
  titre: string;
  type: 'articles';
  articles: Article[];
}

export interface ListeLivres {
  id: string;
  titre: string;
  type: 'livres';
  livres: Livre[];
}

export type Liste = ListeArticles | ListeLivres;
