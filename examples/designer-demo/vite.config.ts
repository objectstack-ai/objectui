import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@object-ui/designer': path.resolve(__dirname, '../../packages/designer/src'),
      '@object-ui/components': path.resolve(__dirname, '../../packages/components/src'),
      '@object-ui/core': path.resolve(__dirname, '../../packages/core/src'),
      '@object-ui/react': path.resolve(__dirname, '../../packages/react/src'),
      '@': path.resolve(__dirname, '../../packages/components/src'),
    }
  }
})
