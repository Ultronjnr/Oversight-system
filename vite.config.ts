import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => ({
  // Fix for Netlify deployment - ensure assets load correctly
  base: '/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: true, // required for LocalTunnel
    port: 4184, // explicit dev port (matches current environment)
    // Leave HMR host/port unset so the client will connect to the same origin in the browser.
    // Hardcoding localhost/port breaks HMR when accessed via a remote proxy (Fly/LocalTunnel/etc.).
    hmr: {
      protocol: 'ws'
    },
    allowedHosts: [
      '.loca.lt', // allow LocalTunnel subdomains
    ],
  },
  preview: {
    port: 4184, // preview also on 4184
    host: true,
    hmr: {
      protocol: 'ws'
    },
    allowedHosts: [
      '.loca.lt',
    ],
  },
  plugins: [
    react(),
    nodePolyfills(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
