import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ⚡️ DX: Fix Shadcn component imports in the monorepo source
      "@/ui": path.resolve(__dirname, "../../packages/components/src/ui"),
      "@/lib/utils": path.resolve(__dirname, "../../packages/components/src/lib/utils"),
      "@/hooks": path.resolve(__dirname, "../../packages/components/src/hooks"),
      
      "@": path.resolve(__dirname, "./src"),
      // ⚡️ DX: App Data Symlink
      "@app": path.resolve(__dirname, "./src/app-data"),

      // ⚡️ DX: Map imports to source code for Hot Module Replacement
      "@object-ui/components": path.resolve(__dirname, "../../packages/components/src"),
      "@object-ui/react": path.resolve(__dirname, "../../packages/react/src"),
      "@object-ui/core": path.resolve(__dirname, "../../packages/core/src"),
      "@object-ui/types": path.resolve(__dirname, "../../packages/types/src"),
      "@object-ui/data-objectql": path.resolve(__dirname, "../../packages/data-objectql/src"),
      "@object-ui/plugin-kanban": path.resolve(__dirname, "../../packages/plugin-kanban/src"),
      "@object-ui/plugin-charts": path.resolve(__dirname, "../../packages/plugin-charts/src"),
    },
  },
})
