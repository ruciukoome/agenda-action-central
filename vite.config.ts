
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: [
        // Exclude Node.js built-ins that are imported by pg
        'path', 
        'crypto', 
        'fs', 
        'util', 
        'events', 
        'stream', 
        'buffer', 
        'net', 
        'tls', 
        'dns', 
        'string_decoder',
        'cloudflare:sockets'
      ]
    }
  }
}));
