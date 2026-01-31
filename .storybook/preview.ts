import type { Preview } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon';
import { handlers } from './mocks';
import { startMockServer } from './msw-browser';
import { withMSWDebug } from './msw-debug';
import '../packages/components/src/index.css';
import { ComponentRegistry } from '@object-ui/core';
import * as components from '../packages/components/src/index';

// Initialize MSW
initialize({
  onUnhandledRequest: 'bypass'
});

// Start MSW runtime with ObjectStack kernel
// This must be called during Storybook initialization
if (typeof window !== 'undefined') {
  startMockServer().catch(err => {
    console.error('Failed to start MSW runtime:', err);
  });
}

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
import '@object-ui/layout';
import '@object-ui/fields';

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [withMSWDebug],
  parameters: {
    msw: {
       handlers: handlers
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction', 
          'Guide', 
          'Primitives', 
          'Schema', 
          ['Actions', 'Inputs', 'Layout', 'Data Display', 'Navigation', 'Feedback', 'Plugins']
        ],
      },
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // Add accessibility addon configuration
    a11y: {
      element: '#storybook-root',
      config: {},
      options: {},
      manual: false,
    },
  },
};

export default preview;