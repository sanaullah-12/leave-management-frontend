import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Strip developer breadcrumbs from production bundles. `pure` marks these
  // calls side-effect free so the minifier drops them along with the strings
  // and template literals they build — cheaper than a runtime `if (DEV)` guard
  // and it removes the arguments too.
  //
  // console.error/warn are deliberately preserved: they are the only signal
  // available when diagnosing a customer issue from a browser console.
  esbuild: {
    pure: ["console.log", "console.debug", "console.info", "console.trace"],
  },

  server: {
    // Pinned to 3001: ports 3000/5173/5174 are taken by the Tasklytics
    // containers on this machine. strictPort makes a collision fail loudly
    // instead of silently drifting to another port, which would break both
    // CORS and the password-reset links emailed from the backend.
    port: 3001,
    strictPort: true,
  },
})
