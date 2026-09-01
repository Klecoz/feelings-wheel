import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Registration is done by hand in src/pwa.ts so a new deploy can apply
      // itself. The auto-injected script only registers, which left an
      // installed app needing two reloads to pick up a new version.
      injectRegister: false,
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png"],
      manifest: {
        name: "Feelings Wheel",
        short_name: "Feelings",
        description:
          "A feelings wheel for therapy. Everything you log stays on this device.",
        theme_color: "#f7f3ee",
        background_color: "#f7f3ee",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // The whole app is static and all data is local, so precaching the
        // shell is the entire offline story - there is nothing to fetch.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/index.html",
        // Both of these are needed for a new deploy to land on the next open.
        // Supplying a workbox block at all drops the plugin's own defaults, and
        // without clientsClaim a new worker activated but never took over the
        // page that was already open - so the app served the previous build for
        // one more reload.
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
