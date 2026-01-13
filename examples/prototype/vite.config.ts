import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@object-ui/protocol': path.resolve(__dirname, '../../packages/protocol/src'),
      '@object-ui/engine': path.resolve(__dirname, '../../packages/engine/src'),
      '@object-ui/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@object-ui/renderer': path.resolve(__dirname, '../../packages/renderer/src'),
    }
  }
})
