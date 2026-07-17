import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import packageJson from "./package.json";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    setupFiles: ["./src/test/setup.ts"],
  },
  // WKWebView (iOS 15+): fija el target del transform.
  build: {
    target: "safari15",
    rollupOptions: {
      output: {
        // Separa vendors pesados en chunks propios: descargan en paralelo y
        // cachean por separado (no se invalidan al tocar código de la app).
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion")) return "framer";
          if (id.includes("react-router")) return "router";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("jspdf")) return "pdf";
          if (id.includes("@sentry")) return "monitoring";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("i18next")) return "i18n";
          if (id.includes("@capacitor")) return "capacitor";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("vaul")) return "dialogs";
          if (id.includes("react-hook-form") || id.includes("/zod/")) return "forms";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) return "react";
          return "vendor";
        },
      },
    },
  },
});
