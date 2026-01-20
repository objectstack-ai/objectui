import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

export const { docs, meta } = defineDocs({
  dir: '../../docs',
  root: '../../docs',
  files: ['**/*.{md,mdx}', '!**/node_modules/**'],
});

export default defineConfig();
