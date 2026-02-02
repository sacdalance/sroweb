import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: "../",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }, server: {
    proxy: {
      "/api": "http://localhost:3000", // Proxy API requests to Express backend
      "/activities": {
        target: "http://localhost:3000",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return req.url;
          }
        }
      },
    },
  },
  // base: process.env.VITE_BASE_PATH || "/sroapp"
});
