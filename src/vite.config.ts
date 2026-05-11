import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-gemini": ["@google/genai"],
          "vendor-utils": ["markdown-to-jsx"],
        },
      },
    },
  },
  test: {
    globals: true,
  },
});
