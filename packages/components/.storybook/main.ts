import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
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
          '@object-ui/components': path.resolve(__dirname, '../src/index.ts'),
          '@object-ui/fields': path.resolve(__dirname, '../../fields/src/index.tsx'),
          // Alias plugin packages for Storybook to resolve them from workspace
          '@object-ui/plugin-aggrid': path.resolve(__dirname, '../../plugin-aggrid/src/index.tsx'),
          '@object-ui/plugin-calendar': path.resolve(__dirname, '../../plugin-calendar/src/index.tsx'),
          '@object-ui/plugin-charts': path.resolve(__dirname, '../../plugin-charts/src/index.tsx'),
          '@object-ui/plugin-chatbot': path.resolve(__dirname, '../../plugin-chatbot/src/index.tsx'),
          '@object-ui/plugin-dashboard': path.resolve(__dirname, '../../plugin-dashboard/src/index.tsx'),
          '@object-ui/plugin-editor': path.resolve(__dirname, '../../plugin-editor/src/index.tsx'),
          '@object-ui/plugin-form': path.resolve(__dirname, '../../plugin-form/src/index.tsx'),
          '@object-ui/plugin-gantt': path.resolve(__dirname, '../../plugin-gantt/src/index.tsx'),
          '@object-ui/plugin-grid': path.resolve(__dirname, '../../plugin-grid/src/index.tsx'),
          '@object-ui/plugin-kanban': path.resolve(__dirname, '../../plugin-kanban/src/index.tsx'),
          '@object-ui/plugin-map': path.resolve(__dirname, '../../plugin-map/src/index.tsx'),
          '@object-ui/plugin-markdown': path.resolve(__dirname, '../../plugin-markdown/src/index.tsx'),
          '@object-ui/plugin-timeline': path.resolve(__dirname, '../../plugin-timeline/src/index.tsx'),
          '@object-ui/plugin-view': path.resolve(__dirname, '../../plugin-view/src/index.tsx'),
        },
      },
    });
  },
};
export default config;
