import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Bumi Lestari",
          short_name: "Bumi Lestari",
          description: "Keuangan UMKM dan order produk Bumi Lestari",
          lang: "id",
          theme_color: "#386C20",
          background_color: "#FFFFFF",
          display: "standalone",
          start_url: "/",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
        },
        workbox: {
          // Data keuangan selalu dari server: jangan simpan respons API di cache.
          navigateFallbackDenylist: [/^\/api\//],
          // Font Plus Jakarta Sans (Google Fonts): simpan agar tampilan sama saat offline.
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
          ],
        },
      }),
    ],
    server: {
      // Dev: teruskan /api ke backend agar cookie login jalan tanpa CORS.
      proxy: env.VITE_API_PROXY ? { "/api": { target: env.VITE_API_PROXY, changeOrigin: true } } : undefined,
    },
  };
});
