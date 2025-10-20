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
    // Completely disable HMR - removes WebSocket connections
    hmr: false,
    watch: {
      // Disable file watching to reduce resource usage
      ignored: ['**/node_modules/**', '**/.git/**']
    }
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
