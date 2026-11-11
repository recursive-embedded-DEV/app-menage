// Mémoire LOCALE (cet appareil) de la préférence « onglet Nutrition affiché ».
//
// Pourquoi un cache : NavBar est sur toutes les pages, y compris les Recettes,
// qui ne téléchargent pas Supabase (découpage du code). Interroger Supabase
// depuis NavBar annulerait ce gain. NavBar lit donc cette valeur locale,
// instantanément et sans réseau.
// La source officielle reste la table profils_nutrition : useProfilNutrition
// remet ce cache à jour chaque fois qu'il lit ou enregistre le profil.
//
// Ce fichier n'importe PAS Supabase : c'est ce qui le rend léger pour NavBar.

const CLE = 'app-mm:nutrition:v1'
// Événement maison : prévient NavBar quand la valeur change dans CET onglet
// (l'événement « storage » du navigateur ne signale que les AUTRES onglets).
const EVENEMENT = 'app-mm:nutrition'

export function ongletNutritionActif(): boolean {
  try {
    return localStorage.getItem(CLE) === '1'
  } catch {
    return false // stockage indisponible (navigation privée stricte…)
  }
}

export function memoriserOngletNutrition(actif: boolean): void {
  try {
    localStorage.setItem(CLE, actif ? '1' : '0')
  } catch {
    // On ignore : l'onglet ne sera simplement pas mémorisé sur cet appareil.
  }
  window.dispatchEvent(new Event(EVENEMENT))
}

// Pour useSyncExternalStore (NavBar) : s'abonner aux changements.
export function abonnerOngletNutrition(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT, rappel)
  window.addEventListener('storage', rappel)
  return () => {
    window.removeEventListener(EVENEMENT, rappel)
    window.removeEventListener('storage', rappel)
  }
}
