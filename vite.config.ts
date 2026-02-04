import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Fix: Prevent Vite from deleting system files (like .user.ini)
  },
  server: {
    port: 3000,
    host: true, // Allow external access
    // Proxy configuration for Node.js backend
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});