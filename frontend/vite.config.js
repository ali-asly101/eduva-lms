import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // forward any request starting with /api to your backend
      '/api': {
        target: 'http://localhost:4000', // change to 5000 if that's your backend port
        changeOrigin: true,
      },
    },
  },
})
