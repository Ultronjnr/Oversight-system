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
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 4184,
    },
    allowedHosts: [
      '.loca.lt', // allow LocalTunnel subdomains
    ],
  },
  preview: {
    port: 4184, // preview also on 4184
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 4184,
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
