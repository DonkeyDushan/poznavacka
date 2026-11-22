import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /<repository>/
export default defineConfig({
  base: '/poznavacka/',
  plugins: [react()],
})
