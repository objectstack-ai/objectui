import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ["../packages/**/src/**/*.mdx", "../packages/**/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ['../public'],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          // Alias components package to source to avoid circular dependency during build
          '@object-ui/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
          '@object-ui/react': path.resolve(__dirname, '../packages/react/src/index.ts'),
          '@object-ui/components': path.resolve(__dirname, '../packages/components/src/index.ts'),
          '@object-ui/fields': path.resolve(__dirname, '../packages/fields/src/index.tsx'),
          '@object-ui/layout': path.resolve(__dirname, '../packages/layout/src/index.ts'),
          // Alias plugin packages for Storybook to resolve them from workspace
          '@object-ui/plugin-aggrid': path.resolve(__dirname, '../packages/plugin-aggrid/src/index.tsx'),
          '@object-ui/plugin-calendar': path.resolve(__dirname, '../packages/plugin-calendar/src/index.tsx'),
          '@object-ui/plugin-charts': path.resolve(__dirname, '../packages/plugin-charts/src/index.tsx'),
          '@object-ui/plugin-chatbot': path.resolve(__dirname, '../packages/plugin-chatbot/src/index.tsx'),
          '@object-ui/plugin-dashboard': path.resolve(__dirname, '../packages/plugin-dashboard/src/index.tsx'),
          '@object-ui/plugin-editor': path.resolve(__dirname, '../packages/plugin-editor/src/index.tsx'),
          '@object-ui/plugin-form': path.resolve(__dirname, '../packages/plugin-form/src/index.tsx'),
          '@object-ui/plugin-gantt': path.resolve(__dirname, '../packages/plugin-gantt/src/index.tsx'),
          '@object-ui/plugin-grid': path.resolve(__dirname, '../packages/plugin-grid/src/index.tsx'),
          '@object-ui/plugin-kanban': path.resolve(__dirname, '../packages/plugin-kanban/src/index.tsx'),
          '@object-ui/plugin-map': path.resolve(__dirname, '../packages/plugin-map/src/index.tsx'),
          '@object-ui/plugin-markdown': path.resolve(__dirname, '../packages/plugin-markdown/src/index.tsx'),
          '@object-ui/plugin-timeline': path.resolve(__dirname, '../packages/plugin-timeline/src/index.tsx'),
          '@object-ui/plugin-view': path.resolve(__dirname, '../packages/plugin-view/src/index.tsx'),
        },
      },
    });
  },
};
export default config;
