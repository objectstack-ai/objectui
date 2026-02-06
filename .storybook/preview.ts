import type { Preview, LoaderFunction } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon';
import { handlers } from './mocks';
import { startMockServer, getHandlers } from './msw-browser';
import '../packages/components/src/index.css';

import { ComponentRegistry } from '@object-ui/core';
import * as components from '../packages/components/src/index';

// Initialize MSW
initialize({
  onUnhandledRequest: 'bypass'
});

// Custom loader to ensure ObjectStack kernel is ready and handlers are active
const objectStackLoader: LoaderFunction = async (context) => {
  // Ensure kernel is started
  if (typeof window !== 'undefined') {
    await startMockServer().catch(err => {
      console.error('Failed to start MSW runtime:', err);
    });
  }

  // Get dynamic handlers from the ObjectStack kernel
  const kernelHandlers = getHandlers();
  
  // Inject kernel handlers into parameters for mswLoader to pick up.
  // We prepend them so specific story handlers can override them if needed,
  // OR we append them if we want kernel to be fallback.
  // Generally, specific mocks should win, so kernel handlers should be 'after' or 'fallback'.
  // But msw-storybook-addon applies handlers in order.
  
  // If we assume MSW standard: first matching handler wins.
  // So specific story handlers (from parameters.msw.handlers) should come FIRST.
  // Kernel handlers (generic) should come LAST.
  
  const existingHandlers = context.parameters.msw?.handlers || [];
  
  // Careful: existingHandlers might be a single handler or array.
  const existingArray = Array.isArray(existingHandlers) ? existingHandlers : [existingHandlers].filter(Boolean);
  
  context.parameters.msw = {
    ...context.parameters.msw,
    handlers: [...existingArray, ...kernelHandlers]
  };

  // Now run the standard mswLoader which will use the updated parameters
  return mswLoader(context);
};

// Register all base components for Storybook
Object.values(components);


// Import and register all plugin components for Storybook
// This ensures plugin components are available for the plugin stories
import '@object-ui/plugin-aggrid';
import '@object-ui/plugin-calendar';
import '@object-ui/plugin-charts';
import '@object-ui/plugin-chatbot';
import '@object-ui/plugin-dashboard';
import '@object-ui/plugin-detail';
import '@object-ui/plugin-editor';
import '@object-ui/plugin-form';
import '@object-ui/plugin-gantt';
import '@object-ui/plugin-grid';
import '@object-ui/plugin-kanban';
import '@object-ui/plugin-list';
import '@object-ui/plugin-map';
import '@object-ui/plugin-markdown';
import '@object-ui/plugin-report';
import '@object-ui/plugin-timeline';
import '@object-ui/plugin-view';
import '@object-ui/layout';
import '@object-ui/fields';

const preview: Preview = {
  loaders: [objectStackLoader],
  parameters: {
    msw: {
       handlers: handlers
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Getting Started',
            ['Introduction', 'Data Binding'],
          'Primitives',
            ['General', 'Data Display', 'Data Entry', 'Navigation', 'Feedback', 'Overlay', 'Layout'],
          'Fields',
            ['Gallery'],
          'Plugins',
            ['Data Views', 'Forms', 'Scheduling', 'Rich Content'],
          'Templates',
            ['Dashboard', 'Page', 'Reports', 'Sidebar'],
          'Apps',
            ['CRM'],
        ],
      },
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;