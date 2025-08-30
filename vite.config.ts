import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@/components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@/components/ui', replacement: path.resolve(__dirname, 'src/components/ui') },
      { find: '@/lib', replacement: path.resolve(__dirname, 'src/lib') },
    ],
  },
  server: {
    https: false,
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
