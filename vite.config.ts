import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // WKWebView (iOS 15+): fija el target del transform.
  // ponytail: sin manualChunks — el code-splitting por ruta + auto-chunking de rolldown ya reparten el vendor.
  build: {
    target: "safari15",
  },
});
