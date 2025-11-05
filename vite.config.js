import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: '/index.html'
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/assets': '/public/assets'
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
