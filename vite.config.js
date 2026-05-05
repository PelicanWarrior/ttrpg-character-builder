import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '::',
    port: 5176,
    strictPort: true,
    middlewareMode: false,
    historyApiFallback: true,
    proxy: {
      '/SW_Pictures/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        ws: true,
      },
      '/F_Pictures/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});