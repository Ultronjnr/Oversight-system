import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: true, // ✅ required for LocalTunnel
    port: 4178, // ✅ updated to 4178
    allowedHosts: [
      '.loca.lt', // ✅ allow LocalTunnel subdomains
    ],
  },
  preview: {
    port: 4178, // ✅ updated preview port
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
