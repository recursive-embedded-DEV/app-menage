import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { etatPourEnfant, useRetour } from '../hooks/useRetour'
import { DESSINS } from './dessins'
import { Icone } from './Icones'

interface Props {
  // Page parente : destination du retour quand la page a été ouverte
  // directement (aucune page de l'app derrière elle).
  repli: string
  // Formulaire : une croix (« fermer sans enregistrer ») au lieu du chevron.
  fermer?: boolean
  // Actions à droite (ex. <LienModifier>).
  children?: ReactNode
}

// Barre du haut des pages qui ne sont pas des onglets : chevron ‹ (ou croix)
// à gauche, actions à droite. Les onglets (Agenda, Listes, Recettes,
// Nutrition) n'en ont pas : la barre de navigation suffit.
export default function BarreHaut({ repli, fermer = false, children }: Props) {
  const { retour } = useRetour(repli)
  const libelle = fermer ? 'Fermer sans enregistrer' : 'Retour'
  return (
    <nav className="barre-haut">
      {/* title : info-bulle à la souris ; aria-label : lecteurs d'écran. */}
      <button type="button" className="bouton-icone" aria-label={libelle} title={libelle} onClick={retour}>
        <Icone dessin={fermer ? DESSINS.fermer : DESSINS.retour} taille={fermer ? 22 : 24} />
      </button>
      {children}
    </nav>
  )
}

// Crayon de la barre du haut : ouvre le formulaire de modification.
// L'état transmis permet au formulaire de « sauter » cette page au besoin
// (voir retourDouble dans useRetour).
export function LienModifier({ vers, libelle }: { vers: string; libelle: string }) {
  const location = useLocation()
  return (
    <Link to={vers} state={etatPourEnfant(location)} className="bouton-icone" aria-label={libelle} title={libelle}>
      <Icone dessin={DESSINS.modifier} />
    </Link>
  )
}
