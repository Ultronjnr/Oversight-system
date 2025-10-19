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
    // HMR configuration for remote deployments
    // Detect if we're on HTTPS and use WSS, otherwise use WS
    hmr: {
      protocol: 'wss', // Use WSS (secure WebSocket) for HTTPS deployments
      host: undefined, // Let browser auto-detect the host from current origin
      port: 443, // Use standard HTTPS port for WSS
    },
    allowedHosts: [
      '.loca.lt', // allow LocalTunnel subdomains
      '.fly.dev', // allow fly.dev deployments
      'oversight.global', // allow oversight.global domain
    ],
  },
  preview: {
    port: 4184, // preview also on 4184
    host: true,
    hmr: {
      protocol: 'wss', // Use WSS (secure WebSocket) for HTTPS deployments
      host: undefined,
      port: 443,
    },
    allowedHosts: [
      '.loca.lt',
      '.fly.dev',
      'oversight.global',
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
