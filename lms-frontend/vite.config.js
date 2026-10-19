import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL("./app.html", import.meta.url)),
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        java: fileURLToPath(
          new URL("./java-backend-developer.html", import.meta.url),
        ),
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
    },
  },
});
