import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // The API runs separately (backend/, port 4729); its URL comes from VITE_API_BASE_URL.
  server: { port: 5729, strictPort: true },
  preview: { port: 5729, strictPort: true },
});
