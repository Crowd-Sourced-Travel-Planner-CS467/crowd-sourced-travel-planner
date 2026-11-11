import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Forward any request starting with /api to the Express backend on port 3000
      '/api': {
        target: 'http://localhost:3000'
      }
    }
  }

})