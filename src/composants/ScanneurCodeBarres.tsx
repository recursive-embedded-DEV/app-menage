import { useEffect, useRef, useState } from 'react'
import { estIsbn13 } from '../utils/livres'

interface Props {
  onDetecte: (isbn13: string) => void // un ISBN-13 VALIDE a été lu
  onAnnuler: () => void
}

// Ce que renvoie ZXing pour arrêter la caméra.
interface Controles {
  stop: () => void
}

// Message clair selon l'erreur de la caméra (getUserMedia).
function messageErreur(erreur: unknown): string {
  const nom = erreur instanceof DOMException ? erreur.name : ''
  if (nom === 'NotAllowedError') return 'Accès à la caméra refusé : autorise-le dans les réglages du navigateur, puis réessaie.'
  if (nom === 'NotFoundError' || nom === 'OverconstrainedError') return 'Aucune caméra trouvée sur cet appareil.'
  if (nom === 'NotReadableError') return 'La caméra est déjà utilisée par une autre application.'
  return "Impossible d'ouvrir la caméra."
}

// Lecture du code-barres d'un livre avec la caméra arrière.
// Le code-barres d'un livre est un EAN-13, qui EST son ISBN-13 (978… / 979…).
//
// L'API native BarcodeDetector n'existe pas dans Safari (iPhone) : on utilise
// la bibliothèque ZXing, chargée SEULEMENT à l'ouverture du scanner (import()
// dynamique : un fichier séparé, que le reste de l'app ne télécharge jamais).
// La caméra exige une page sécurisée (https, ou localhost en développement).
// Donnée DÉRIVÉE de l'environnement : calculée, pas besoin d'un état.
const cameraPossible = () => Boolean(navigator.mediaDevices?.getUserMedia)

export default function ScanneurCodeBarres({ onDetecte, onAnnuler }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [etat, setEtat] = useState<'demarrage' | 'actif' | 'erreur'>('demarrage')
  const [message, setMessage] = useState<string | null>(null)

  // Le parent passe une nouvelle fonction à chaque rendu : on la garde dans une
  // ref pour que l'effet de la caméra ne redémarre pas à chaque fois.
  const rappel = useRef(onDetecte)
  useEffect(() => {
    rappel.current = onDetecte
  })

  useEffect(() => {
    let controles: Controles | null = null
    let fini = false // démonté, ou code trouvé : on ne fait plus rien

    if (!cameraPossible()) return

    Promise.all([import('@zxing/browser'), import('@zxing/library')])
      .then(([{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }]) => {
        if (fini || !video.current) return null
        // Seulement l'EAN-13 : lecture plus rapide, moins d'erreurs.
        const indices = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]]])
        const lecteur = new BrowserMultiFormatReader(indices)
        return lecteur.decodeFromConstraints({ video: { facingMode: 'environment' } }, video.current, (resultat) => {
          if (!resultat || fini) return // rien de lisible dans cette image : on continue
          const code = resultat.getText()
          if (!estIsbn13(code)) {
            // Code de produit ordinaire, ou lecture de travers : on continue.
            setMessage("Ce code-barres n'est pas celui d'un livre (ISBN). Vise le code au dos du livre.")
            return
          }
          fini = true
          controles?.stop() // éteint la caméra (le voyant s'éteint)
          rappel.current(code)
        })
      })
      .then((c) => {
        if (!c) return
        controles = c
        if (fini) c.stop() // démonté pendant le démarrage
        else setEtat('actif')
      })
      .catch((erreur) => {
        if (fini) return
        setEtat('erreur')
        setMessage(messageErreur(erreur))
      })

    // Fermeture du scanner ou de la boîte : la caméra s'éteint toujours.
    return () => {
      fini = true
      controles?.stop()
    }
  }, [])

  if (!cameraPossible()) {
    return (
      <div className="scanneur">
        <p className="message-erreur">La caméra exige une connexion sécurisée (https).</p>
        <button type="button" className="bouton-discret" onClick={onAnnuler}>
          Fermer
        </button>
      </div>
    )
  }

  return (
    <div className="scanneur">
      {/* playsInline : sur iPhone, la vidéo reste dans la page (pas en plein écran). */}
      <div className="scanneur-video">
        <video ref={video} muted playsInline />
        {etat === 'actif' && <span className="scanneur-guide" aria-hidden="true" />}
      </div>
      <p className="note-portions" role="status">
        {etat === 'demarrage' && 'Ouverture de la caméra…'}
        {etat === 'actif' && !message && 'Vise le code-barres au dos du livre.'}
        {message}
      </p>
      <button type="button" className="bouton-discret" onClick={onAnnuler}>
        Annuler le scan
      </button>
    </div>
  )
}
