import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        id: "/app?source=pwa",
        name: "Ternakin",
        short_name: "Ternakin",
        description: "Asisten digital peternak ayam",
        lang: "id",
        start_url: "/app?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#FFFFFF",
        theme_color: "#F97316",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/v1\//, /^\/health$/],
        globPatterns: ["**/*.{js,css,html,svg,woff2,png,webp,json}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === "/v1/toko",
            handler: "NetworkFirst",
            options: {
              cacheName: "v1-toko",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname === "/v1/referensi",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "v1-referensi",
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/v1": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});
