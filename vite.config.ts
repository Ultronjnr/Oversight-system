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
    host: '0.0.0.0',
    port: 4184,
    allowedHosts: 'all',
    // Configure HMR for remote deployments
    // Don't use WebSocket at all to avoid connection issues
    middlewareMode: false,
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
