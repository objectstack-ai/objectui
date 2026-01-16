import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@object-ui/core': path.resolve(__dirname, '../../packages/core/src'),
      '@object-ui/types': path.resolve(__dirname, '../../packages/types/src'),
      '@object-ui/components': path.resolve(__dirname, '../../packages/components/src'),
      '@object-ui/designer': path.resolve(__dirname, '../../packages/designer/src'),
      '@object-ui/react': path.resolve(__dirname, '../../packages/react/src'),
    },
  },
});
