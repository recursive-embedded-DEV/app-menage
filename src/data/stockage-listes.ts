import type { Article, Livre, Liste, TypeListe } from '../types/liste'
import { premierLibre } from '../utils/identifiants'
import { idUtilisateur } from './auth'
import { supabase } from './supabase'

// Le SEUL fichier qui sait OÙ les listes sont enregistrées : Supabase.
// Avant (localStorage), on réécrivait tout le tableau des listes à chaque
// changement. Maintenant, chaque opération touche UNE ligne de la base : si
// Mariana coche « Lait » pendant que Mathieu ajoute « Pain », aucune des deux
// modifications n'écrase l'autre.
//
// Toutes les fonctions sont asynchrones (elles passent par le réseau) et
// lancent une erreur si Supabase refuse : c'est useListes qui décide quoi en faire.

// Forme d'une ligne renvoyée par la requête de chargerListes.
interface LigneListe {
  id: string
  titre: string
  type: 'articles' | 'livres'
  proprietaire_id: string | null // null : liste partagée
  articles: Article[]
  livres: Livre[]
}

// Supabase ne lance pas d'erreur : il la RENVOIE. On la relance pour que
// l'appelant puisse utiliser try/catch.
function verifier({ error }: { error: unknown }): void {
  if (error) throw error
}

export async function chargerListes(): Promise<Liste[]> {
  // Une seule requête : PostgREST (l'API de Supabase) suit les clés étrangères
  // et imbrique les articles et les livres dans chaque liste.
  const { data, error } = await supabase
    .from('listes')
    .select('id, titre, type, proprietaire_id, articles(id, texte, coche), livres(id, titre, auteur, lien, isbn, image, categorie)')
    .order('cree_le')
    .order('cree_le', { referencedTable: 'articles' })
    .order('cree_le', { referencedTable: 'livres' })
  if (error) throw error

  // On reconstruit l'union discriminée : une liste d'articles n'a pas de
  // champ `livres`, et inversement.
  // Les listes personnelles de l'AUTRE membre n'arrivent jamais ici : la base
  // (RLS) ne les renvoie pas.
  return (data as LigneListe[]).map((l): Liste => {
    const personnelle = l.proprietaire_id !== null
    return l.type === 'articles'
      ? { id: l.id, titre: l.titre, type: 'articles', articles: l.articles, personnelle }
      : { id: l.id, titre: l.titre, type: 'livres', livres: l.livres, personnelle }
  })
}

// L'identifiant vient du client (crypto.randomUUID) : l'écran et la base
// connaissent le même id dès le départ.
export async function insererArticle(listeId: string, article: Article): Promise<void> {
  verifier(await supabase.from('articles').insert({ ...article, liste_id: listeId }))
}

// Plusieurs articles d'un coup (ex. ingrédients d'une recette) : UNE seule
// requête réseau, et tous réussissent ou échouent ensemble.
export async function insererArticles(listeId: string, articles: Article[]): Promise<void> {
  verifier(await supabase.from('articles').insert(articles.map((a) => ({ ...a, liste_id: listeId }))))
}

export async function modifierCoche(articleId: string, coche: boolean): Promise<void> {
  verifier(await supabase.from('articles').update({ coche }).eq('id', articleId))
}

export async function supprimerArticle(articleId: string): Promise<void> {
  verifier(await supabase.from('articles').delete().eq('id', articleId))
}

export async function supprimerCoches(listeId: string): Promise<void> {
  verifier(await supabase.from('articles').delete().eq('liste_id', listeId).eq('coche', true))
}

export async function insererLivre(listeId: string, livre: Livre): Promise<void> {
  verifier(await supabase.from('livres').insert({ ...livre, liste_id: listeId }))
}

export async function modifierLivre(livre: Livre): Promise<void> {
  const { id, ...champs } = livre
  verifier(await supabase.from('livres').update(champs).eq('id', id))
}

export async function supprimerLivre(livreId: string): Promise<void> {
  verifier(await supabase.from('livres').delete().eq('id', livreId))
}

// ---------------------------------------------------------------------
// Les listes elles-mêmes (créer, renommer, supprimer).
// ---------------------------------------------------------------------

// Crée une liste et renvoie son identifiant : « quincaillerie » s'il est libre,
// sinon « quincaillerie-2 »… (il sert dans l'adresse et ne change plus).
// Piège : les listes PERSONNELLES de l'autre membre sont invisibles (RLS) ;
// un identifiant qui semble libre peut donc être déjà pris. La base refuse
// alors le doublon (code 23505) : on réessaie avec le suivant.
export async function creerListe(base: string, titre: string, type: TypeListe, personnelle: boolean): Promise<string> {
  const proprietaire_id = personnelle ? await idUtilisateur() : null
  const { data, error } = await supabase.from('listes').select('id').like('id', `${base}%`)
  if (error) throw error
  const pris = new Set((data as { id: string }[]).map((l) => l.id))

  for (let essai = 0; essai < 10; essai++) {
    const id = premierLibre(base, pris)
    const resultat = await supabase.from('listes').insert({ id, titre, type, proprietaire_id })
    if (!resultat.error) return id
    if (resultat.error.code !== '23505') throw resultat.error
    pris.add(id) // pris par une liste invisible : au suivant
  }
  throw new Error('Aucun identifiant libre trouvé')
}

// Noms des listes visibles (pour relier un événement de l'agenda à une liste) :
// requête légère, sans les articles ni les livres.
export async function titresListes(): Promise<{ id: string; titre: string }[]> {
  const { data, error } = await supabase.from('listes').select('id, titre').order('cree_le')
  if (error) throw error
  return data as { id: string; titre: string }[]
}

// Partagée ↔ personnelle (au nom du membre connecté). L'Épicerie reste
// partagée : la base le refuse (contrainte listes_epicerie_partagee).
export async function changerPartage(id: string, personnelle: boolean): Promise<void> {
  const proprietaire_id = personnelle ? await idUtilisateur() : null
  verifier(await supabase.from('listes').update({ proprietaire_id }).eq('id', id))
}

export async function renommerListe(id: string, titre: string): Promise<void> {
  verifier(await supabase.from('listes').update({ titre }).eq('id', id))
}

// Supprime la liste ET son contenu (on delete cascade, supabase/schema.sql).
export async function supprimerListe(id: string): Promise<void> {
  verifier(await supabase.from('listes').delete().eq('id', id))
}

// Temps réel : Supabase prévient l'app quand une liste, un article ou un livre
// change, peu importe quel téléphone l'a modifié. Les règles RLS s'appliquent
// aussi : seuls les membres reçoivent les événements.
// Retourne la fonction qui arrête l'écoute (à appeler au démontage).
export function ecouterChangements(rappel: () => void): () => void {
  // Nom unique : en développement, React monte les composants deux fois
  // (StrictMode) ; deux canaux du même nom entreraient en conflit.
  const canal = supabase
    .channel(`listes-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listes' }, rappel)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, rappel)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'livres' }, rappel)
    .subscribe()
  return () => {
    supabase.removeChannel(canal)
  }
}
