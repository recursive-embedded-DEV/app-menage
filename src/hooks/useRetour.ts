import { useLocation, useNavigate } from 'react-router'
import type { Location } from 'react-router'

// « Revenir » comme le geste de retour du téléphone, plutôt que d'aller
// toujours à la même adresse.
//
// React Router donne à chaque entrée d'historique une clé (location.key).
// La PREMIÈRE page ouverte dans l'onglet (lien partagé, PWA qui démarre,
// adresse tapée) a la clé 'default' : il n'y a alors rien de « l'app »
// derrière elle, et naviguer(-1) quitterait l'app. Dans ce cas, on va à la
// page parente (repli), en REMPLAÇANT l'entrée (pas de boucle avant/arrière).
//
// État transmis par un lien (ex. le crayon d'une recette) : parentInterne
// dit si la page qui a ouvert celle-ci avait elle-même une page de l'app
// derrière elle. Utile pour retourDouble (voir plus bas).
interface EtatRetour {
  parentInterne?: boolean
}

// À passer en `state` d'un <Link> vers une page qui pourrait devoir
// « sauter » la page courante (formulaire de modification).
export const etatPourEnfant = (location: Location): EtatRetour => ({ parentInterne: location.key !== 'default' })

export function useRetour(repli: string) {
  const naviguer = useNavigate()
  const location = useLocation()
  const interne = location.key !== 'default'
  const parentInterne = interne && Boolean((location.state as EtatRetour | null)?.parentInterne)

  return {
    // Une page en arrière (ou la page parente).
    retour: () => (interne ? naviguer(-1) : naviguer(repli, { replace: true })),
    // DEUX pages en arrière : quand la page précédente n'a plus de sens
    // (recette supprimée depuis son formulaire, événement déplacé dans un
    // autre agenda : son ancienne adresse ne mène plus nulle part).
    // Sans historique sûr : la destination donnée, en remplacement.
    retourDouble: (destination: string) => (parentInterne ? naviguer(-2) : naviguer(destination, { replace: true })),
  }
}
