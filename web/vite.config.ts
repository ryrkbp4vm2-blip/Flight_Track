import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["plane.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Military Flight Tracker",
        short_name: "MilTrack",
        description: "Live military aircraft worldwide, on a map.",
        theme_color: "#0b0f14",
        background_color: "#0b0f14",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Never let the service worker intercept or cache live data routes.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Live data is always network-only.
            urlPattern: /\/api\//,
            handler: "NetworkOnly",
          },
          {
            // Basemap tiles: cache modestly so the shell loads quickly.
            urlPattern: /^https:\/\/[a-d]?\.?basemaps\.cartocdn\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "carto-tiles",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Frontend always calls same-origin /api; in dev this hits the Express
      // proxy, sidestepping CORS in both dev and prod.
      "/api": "http://localhost:3001",
    },
  },
});
