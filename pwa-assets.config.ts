import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Génère les icônes PNG de la PWA à partir de public/favicon.svg.
// Commande (à relancer seulement si l'icône change) :
//   npx pwa-assets-generator
// Les PNG produits sont dans public/ et sont commités : le build n'a pas à les régénérer.
//
// Le préréglage « minimal 2023 » produit le strict nécessaire :
//   pwa-64x64.png, pwa-192x192.png, pwa-512x512.png (manifeste),
//   maskable-icon-512x512.png (Android, découpable en cercle ou en goutte),
//   apple-touch-icon-180x180.png (écran d'accueil de l'iPhone), favicon.ico.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    // Icônes normales : pas de marge (sinon un cadre transparent entoure le carré bleu).
    transparent: { ...preset.transparent, padding: 0 },
    // Les icônes « maskable » et Apple ajoutent une marge autour du dessin :
    // on la remplit avec le bleu de l'icône plutôt qu'avec du blanc.
    // Maskable : 30 % de marge (Android peut découper l'icône en cercle).
    maskable: { ...preset.maskable, resizeOptions: { background: '#1B3A5C' } },
    // Apple : iOS ne fait qu'arrondir les coins, 15 % de marge suffit.
    apple: { ...preset.apple, padding: 0.15, resizeOptions: { background: '#1B3A5C' } },
  },
  images: ['public/favicon.svg'],
})
