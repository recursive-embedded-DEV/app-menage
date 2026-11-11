import { useRegisterSW } from 'virtual:pwa-register/react'

// Une heure, en millisecondes.
const UNE_HEURE = 60 * 60 * 1000

// Enregistre le service worker et annonce les nouvelles versions du site.
//
// Fonctionnement : après un déploiement, le téléphone télécharge le nouveau
// service worker en arrière-plan, mais celui-ci ATTEND (état « waiting ») :
// l'ancienne version reste active. needRefresh devient vrai, la bannière
// s'affiche, et c'est l'utilisateur qui déclenche le changement. On évite ainsi
// un rechargement surprise pendant qu'on écrit dans la liste d'épicerie.
export default function BanniereMiseAJour() {
  const {
    needRefresh: [miseAJourPrete, setMiseAJourPrete],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, enregistrement) {
      if (!enregistrement) return
      // Le navigateur ne cherche une nouvelle version qu'en chargeant une page.
      // Or une PWA installée reste souvent ouverte en arrière-plan pendant des
      // jours, sans jamais recharger. On vérifie donc nous-mêmes :
      // 1. au retour dans l'app (téléphone déverrouillé, app réaffichée) ;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') enregistrement.update()
      })
      // 2. toutes les heures si l'app reste à l'écran.
      setInterval(() => enregistrement.update(), UNE_HEURE)
    },
  })

  if (!miseAJourPrete) return null

  return (
    // role="status" : les lecteurs d'écran annoncent la bannière quand elle apparaît.
    <div className="banniere-maj" role="status">
      <span>Nouvelle version disponible.</span>
      <div>
        <button type="button" className="bouton-discret" onClick={() => setMiseAJourPrete(false)}>
          Plus tard
        </button>
        {/* true : active le nouveau service worker PUIS recharge la page. */}
        <button type="button" className="bouton" onClick={() => updateServiceWorker(true)}>
          Mettre à jour
        </button>
      </div>
    </div>
  )
}
