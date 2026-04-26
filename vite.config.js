import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5176,
    strictPort: true,
    middlewareMode: false,
    historyApiFallback: true,
    proxy: {
      '/SW_Pictures/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      '/F_Pictures/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});