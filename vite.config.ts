import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, isPreview }) => ({
    plugins: [react()],
    // En build : le site vit sous /app-menage/ sur GitHub Pages.
    // En développement : on garde localhost:5173/ comme avant.
    base: command === 'build' || isPreview ? '/app-menage/' : '/',
    server: {
        watch: {
            ignored: ['**/.vs/**'],
        },
    },
}))