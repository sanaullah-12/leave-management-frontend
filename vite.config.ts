import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Brand primary (--blue-600 of the default theme, see styles/design-system.css)
// and the light app background (--app-bg in index.css). Duplicated here as
// literals because the manifest is generated at build time and cannot read CSS
// custom properties; keep them in step if the default theme ever changes.
const THEME_COLOR = '#2563eb'
const BACKGROUND_COLOR = '#e9edf5'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // The service worker replaces itself as soon as a new build is detected,
      // so users never get stuck on a stale bundle. Combined with
      // `clientsClaim` below, an update applies on the next navigation without
      // anyone having to clear a cache.
      registerType: 'autoUpdate',

      // Registration is done explicitly by usePWA() so the app can react to
      // lifecycle events. Letting the plugin also inject a register script
      // would register the worker twice.
      injectRegister: null,

      // Copied verbatim into dist/. These are referenced from index.html and by
      // iOS, which never reads the manifest for its home-screen icon.
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],

      manifest: {
        id: '/',
        name: 'Nexora HRMS',
        short_name: 'Nexora',
        description: 'Modern Human Resource Management System',
        start_url: '/',
        // Without an explicit scope the browser infers it from start_url. Being
        // explicit keeps every in-app route inside the installed window.
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        lang: 'en',
        // Only affects how the manifest's own name/short_name are rendered by
        // the OS. The app's own direction is switched at runtime by
        // LocaleProvider, which sets <html dir> per locale.
        dir: 'ltr',
        categories: ['business', 'productivity'],
        icons: [
          // "any" icons are drawn as supplied, so they keep transparency.
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          // "maskable" icons are cropped to the platform's shape (circle,
          // squircle, rounded square). They need a filled background and the
          // artwork inside the central 80% safe zone, which is why they are
          // separate files rather than a second purpose on the icons above.
          {
            src: 'pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // Precache the shell and every hashed asset. Vite content-hashes
        // filenames, so Workbox stores them with `revision: null` and a build
        // that changes nothing re-downloads nothing.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}'],

        // Heavy, feature-specific vendor chunks are deliberately left out of
        // the precache: they are only needed by the PDF, spreadsheet and
        // document-export screens, and precaching them would add megabytes to
        // the very first load on a phone. The runtime rule below still caches
        // them permanently the first time a user opens one of those screens.
        globIgnores: [
          '**/jspdf*.js',
          '**/html2canvas*.js',
          '**/jszip*.js',
          '**/mammoth*.js',
          '**/purify*.js',
        ],

        // Single-page app: any navigation that is not a real file resolves to
        // the app shell, which is precached and therefore works offline.
        navigateFallback: 'index.html',
        // Never hand an API or asset request to the HTML shell. The backend is
        // on another origin so this is belt and braces, but it also covers
        // same-origin proxying if that is ever introduced.
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],

        // Take over open tabs as soon as the new worker activates instead of
        // waiting for every tab to close. This is what makes `autoUpdate`
        // actually update.
        clientsClaim: true,
        skipWaiting: true,

        // Old precaches from previous deployments are deleted on activation,
        // so storage does not grow without bound across releases.
        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            // Google Fonts stylesheet. Revalidated in the background so a font
            // change is picked up, but never blocks first paint.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // The font files themselves are immutable and versioned in the URL.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // The vendor chunks excluded from the precache above. Hashed
            // filenames make CacheFirst safe: a new build produces a new URL.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /^\/assets\/.*\.(js|css)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-assets',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images shipped with the app (logos, illustrations, Lottie JSON
            // frames) that are not part of the precache glob.
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // API responses are intentionally absent from runtimeCaching. Leave
        // and attendance data is authoritative and changes constantly; serving
        // a cached copy would show an employee a stale balance or a decision
        // that has since been reversed. Anything not matched above simply goes
        // to the network, which is the correct behaviour for this app.
      },

      // A service worker in dev competes with Vite's HMR and caches modules
      // that are meant to be hot-swapped. Test the PWA with a production
      // build instead: `npm run build && npm run preview`.
      devOptions: {
        enabled: false,
      },
    }),
  ],

  // Strip developer breadcrumbs from production bundles. `pure` marks these
  // calls side-effect free so the minifier drops them along with the strings
  // and template literals they build — cheaper than a runtime `if (DEV)` guard
  // and it removes the arguments too.
  //
  // console.error is the only one preserved: an error is the single thing a
  // user or support engineer needs to see in a browser console. Warnings were
  // dropped too - in a shipped build nobody acts on them, and they bury the
  // errors that matter.
  esbuild: {
    pure: [
      "console.log",
      "console.debug",
      "console.info",
      "console.trace",
      "console.warn",
    ],
  },

  build: {
    rollupOptions: {
      output: {
        /**
         * Split the vendor bundle by library family.
         *
         * Everything shared landed in one 812 kB entry chunk, so a one-line app
         * change invalidated React and every other dependency in the browser
         * cache along with it. These groups change on different schedules, so
         * splitting them means a deploy only busts what actually moved, and the
         * pieces download in parallel on a cold visit.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\/]node_modules[\/](react|react-dom|scheduler)[\/]/.test(id))
            return "vendor-react";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("framer-motion") || id.includes("popmotion"))
            return "vendor-motion";
          if (id.includes("recharts") || id.includes("d3-"))
            return "vendor-charts";
          if (id.includes("i18next")) return "vendor-i18n";
          if (id.includes("date-fns")) return "vendor-date";
        },
      },
    },
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
