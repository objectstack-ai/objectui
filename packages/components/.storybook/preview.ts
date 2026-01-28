import type { Preview } from '@storybook/react-vite'
import '../src/index.css';
import { ComponentRegistry } from '@object-ui/core';
import * as components from '../src/index';

// Register all base components for Storybook
Object.values(components);

// Import and register all plugin components for Storybook
// This ensures plugin components are available for the plugin stories
import '@object-ui/plugin-aggrid';
import '@object-ui/plugin-calendar';
import '@object-ui/plugin-charts';
import '@object-ui/plugin-chatbot';
import '@object-ui/plugin-dashboard';
import '@object-ui/plugin-editor';
import '@object-ui/plugin-form';
import '@object-ui/plugin-gantt';
import '@object-ui/plugin-grid';
import '@object-ui/plugin-kanban';
import '@object-ui/plugin-map';
import '@object-ui/plugin-markdown';
import '@object-ui/plugin-timeline';
import '@object-ui/plugin-view';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;