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
      includeAssets: ['student rise.png'],
      manifest: {
        name: 'Student Rise',
        short_name: 'Student Rise',
        description: 'Official Student Rise Portal for GHSS Dadapuram (Dhadhapuram / Dhadapuram) - DGHSS 360',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'student rise.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5174,
    host: true,
  }
})
