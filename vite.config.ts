import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command, isPreview }) => ({
    plugins: [
        react(),
        // PWA : génère au build le manifeste (manifest.webmanifest) et le
        // service worker (sw.js, produit par Workbox). Désactivé en `npm run dev`
        // (par défaut) pour qu'aucun cache ne gêne le développement.
        VitePWA({
            // 'prompt' : une nouvelle version attend que l'utilisateur clique sur
            // « Mettre à jour » (BanniereMiseAJour) au lieu de recharger la page
            // sans prévenir, en pleine saisie dans la liste d'épicerie.
            registerType: 'prompt',
            // L'enregistrement du service worker est fait par React (useRegisterSW),
            // pas par un script injecté automatiquement.
            injectRegister: false,
            // Les icônes sont déjà couvertes par globPatterns (*.png) : sans cette
            // option, elles figureraient deux fois dans le pré-cache.
            includeManifestIcons: false,

            // Le « portrait » de l'app pour le téléphone. start_url et scope
            // prennent la valeur de `base` (/app-menage/) par défaut.
            manifest: {
                name: 'M&M — Ménage',
                short_name: 'M&M',
                description: 'Listes partagées, recettes et agenda du ménage',
                lang: 'fr-CA',
                display: 'standalone',      // plein écran, sans barre d'adresse
                theme_color: '#F4F1EA',     // barre d'état : même couleur que .entete-app
                background_color: '#F4F1EA', // écran de démarrage
                // Icônes générées par `npx pwa-assets-generator` (pwa-assets.config.ts).
                icons: [
                    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },

            workbox: {
                // PRÉ-CACHE : téléchargé à l'installation, l'app s'ouvre sans réseau.
                // Workbox calcule une empreinte de chaque fichier : seuls les fichiers
                // modifiés sont retéléchargés à la mise à jour suivante.
                globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
                // Sauf les images des recettes et des livres : 8,5 Mo, beaucoup trop
                // lourd à imposer à l'installation. Elles ont leur propre règle ci-dessous.
                globIgnores: ['img/**'],

                // Avec HashRouter, toutes les routes React sont dans index.html.
                // agenda.html est encore une page statique séparée : on ne la
                // redirige pas vers index.html.
                navigateFallbackDenylist: [/agenda\.html$/],

                // CACHE À LA DEMANDE : une image est gardée la première fois qu'elle
                // s'affiche, puis servie depuis le téléphone (CacheFirst). Une recette
                // déjà consultée reste donc illustrée hors ligne.
                runtimeCaching: [
                    {
                        urlPattern: /\/img\/.+\.(?:png|jpe?g|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 jours
                        },
                    },
                ],
                // Supabase (API, authentification, temps réel) : aucune règle, donc
                // AUCUN cache. Les listes partagées viennent toujours du serveur.
            },
        }),
    ],
    // En build : le site vit sous /app-menage/ sur GitHub Pages.
    // En développement : on garde localhost:5173/ comme avant.
    base: command === 'build' || isPreview ? '/app-menage/' : '/',
    server: {
        watch: {
            ignored: ['**/.vs/**'],
        },
    },
}))
