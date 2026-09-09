import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

function versionPlugin() {
  return {
    name: 'version-plugin',
    buildStart() {
      let gitCommit = '';
      try {
        gitCommit = execSync('git rev-parse HEAD').toString().trim();
      } catch (e) {
        // ignore
      }
      const version = process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || gitCommit || Date.now().toString();
      const data = { version, buildTime: new Date().toISOString() };
      
      const dir = path.resolve(process.cwd(), 'public');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.resolve(dir, 'version.json'), JSON.stringify(data));
    }
  }
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    versionPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Edu Teacher / DGHSS 360',
        short_name: 'Edu Teacher',
        description: 'DGHSS 360 - Official Academic Analytics & Management Dashboard for GHSS Dadapuram (Dhadhapuram / Dhadapuram)',
        theme_color: '#111827',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
