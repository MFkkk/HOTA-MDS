import { defineConfig } from "vite";


export default defineConfig({
  esbuild: {
    jsxInject: `import React from "react"`,
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
  },
});
