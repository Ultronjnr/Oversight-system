import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    host: true, // ✅ required for LocalTunnel
    port: 4182, // ✅ using port 4182
    allowedHosts: [
      '.loca.lt', // ✅ allow LocalTunnel subdomains
    ],
  },
  preview: {
    port: 4182, // ✅ preview also on 4182
    host: true,
    allowedHosts: [
      '.loca.lt',
    ],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
