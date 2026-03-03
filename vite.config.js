import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'RN Planner',
        short_name: 'RN Planner',
        description: 'Aplicativo de gestão de rotas e visitas.',
        theme_color: '#000000', // A cor da barra superior do celular
        background_color: '#F4F5F7',
        display: 'standalone', // Isso é o que tira a barra do navegador!
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})