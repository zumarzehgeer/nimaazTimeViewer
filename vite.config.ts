import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/hadith-api': {
        target: 'https://hadithapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hadith-api/, '/public/api'),
      },
    },
  },
})
