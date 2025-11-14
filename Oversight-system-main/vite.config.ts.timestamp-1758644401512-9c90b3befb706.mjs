// vite.config.ts
import { defineConfig } from "file:///C:/Users/Micha/Downloads/quote-flow-oversight%20(1)/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Micha/Downloads/quote-flow-oversight%20(1)/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/Micha/Downloads/quote-flow-oversight%20(1)/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Micha\\Downloads\\quote-flow-oversight (1)";
var vite_config_default = defineConfig(({ mode }) => ({
  // Fix for Netlify deployment - ensure assets load correctly
  base: "/",
  build: {
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: void 0
      }
    }
  },
  server: {
    host: true,
    // ✅ required for LocalTunnel
    port: 4182,
    // ✅ using port 4182
    allowedHosts: [
      ".loca.lt"
      // ✅ allow LocalTunnel subdomains
    ]
  },
  preview: {
    port: 4182,
    // ✅ preview also on 4182
    host: true,
    allowedHosts: [
      ".loca.lt"
    ]
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNaWNoYVxcXFxEb3dubG9hZHNcXFxccXVvdGUtZmxvdy1vdmVyc2lnaHQgKDEpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNaWNoYVxcXFxEb3dubG9hZHNcXFxccXVvdGUtZmxvdy1vdmVyc2lnaHQgKDEpXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9NaWNoYS9Eb3dubG9hZHMvcXVvdGUtZmxvdy1vdmVyc2lnaHQlMjAoMSkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgLy8gRml4IGZvciBOZXRsaWZ5IGRlcGxveW1lbnQgLSBlbnN1cmUgYXNzZXRzIGxvYWQgY29ycmVjdGx5XG4gIGJhc2U6ICcvJyxcbiAgYnVpbGQ6IHtcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHVuZGVmaW5lZCxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogdHJ1ZSwgLy8gXHUyNzA1IHJlcXVpcmVkIGZvciBMb2NhbFR1bm5lbFxuICAgIHBvcnQ6IDQxODIsIC8vIFx1MjcwNSB1c2luZyBwb3J0IDQxODJcbiAgICBhbGxvd2VkSG9zdHM6IFtcbiAgICAgICcubG9jYS5sdCcsIC8vIFx1MjcwNSBhbGxvdyBMb2NhbFR1bm5lbCBzdWJkb21haW5zXG4gICAgXSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxODIsIC8vIFx1MjcwNSBwcmV2aWV3IGFsc28gb24gNDE4MlxuICAgIGhvc3Q6IHRydWUsXG4gICAgYWxsb3dlZEhvc3RzOiBbXG4gICAgICAnLmxvY2EubHQnLFxuICAgIF0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlWLFNBQVMsb0JBQW9CO0FBQzlXLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQTtBQUFBLEVBRXpDLE1BQU07QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sY0FBYztBQUFBLE1BQ1o7QUFBQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxNQUNaO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQzVDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
