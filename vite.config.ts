import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves this project at /renting-cars-system/. Local dev stays at /.
  base: process.env.GITHUB_ACTIONS ? '/renting-cars-system/' : '/',
})
