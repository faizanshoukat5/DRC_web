import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "client"),

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon-16.png",
        "favicon-32.png",
        "opengraph.jpg",
        "brand/aeye-icon-192.png",
        "brand/aeye-icon-512.png",
      ],
      manifest: {
        name: "A-EYE - Retinal Screening",
        short_name: "A-EYE",
        description: "AI-powered diabetic retinopathy screening",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0284c7",
        theme_color: "#0284c7",
        icons: [
          {
            src: "/brand/aeye-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/brand/aeye-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },

  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
