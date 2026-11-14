import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        render: resolve(import.meta.dirname, 'render.html'),
      },
    },
  },
});
