import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pinned to 3001: ports 3000/5173/5174 are taken by the Tasklytics
    // containers on this machine. strictPort makes a collision fail loudly
    // instead of silently drifting to another port, which would break both
    // CORS and the password-reset links emailed from the backend.
    port: 3001,
    strictPort: true,
  },
})
