import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/leaflet")) return "leaflet";
          if (id.includes("node_modules/framer-motion")) return "motion";
          if (id.includes("node_modules/react")) return "react-vendor";
        },
      },
    },
  },
});
