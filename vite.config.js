import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    css: true,
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/guardian': {
        target: 'https://content.guardianapis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/guardian/, ''),
      },
      '/api/gnews': {
        target: 'https://gnews.io/api/v4',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/gnews/, ''),
      },
      '/api/newsdata': {
        target: 'https://newsdata.io/api/1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/newsdata/, ''),
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api/guardian': {
        target: 'https://content.guardianapis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/guardian/, ''),
      },
      '/api/gnews': {
        target: 'https://gnews.io/api/v4',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/gnews/, ''),
      },
      '/api/newsdata': {
        target: 'https://newsdata.io/api/1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/newsdata/, ''),
      },
    },
  },
});
