import type { Preview } from '@storybook/react-vite'
import { mswLoader } from 'msw-storybook-addon';
import { handlers } from './mocks';
import { startMockServer } from './msw-browser';
import '../packages/components/src/index.css';
import { ComponentRegistry } from '@object-ui/core';
import * as components from '../packages/components/src/index';

// Note: MSW is initialized by MSWPlugin in msw-browser.ts
// We don't need to call initialize() from msw-storybook-addon

// Track MSW initialization state
let mswInitialized = false;
let mswInitPromise: Promise<void> | null = null;

// Start MSW runtime with ObjectStack kernel
// This must be called during Storybook initialization
if (typeof window !== 'undefined') {
  mswInitPromise = startMockServer()
    .then(() => {
      mswInitialized = true;
      console.log('[Storybook] MSW Runtime Ready');
    })
    .catch(err => {
      console.error('Failed to start MSW runtime:', err);
      throw err;
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

/**
 * Loader that ensures MSW runtime is initialized before rendering stories.
 * This prevents race conditions where stories try to fetch data before handlers are ready.
 */
const ensureMSWReady = async () => {
  if (!mswInitialized && mswInitPromise) {
    console.log('[Storybook] Waiting for MSW runtime to initialize...');
    await mswInitPromise;
    // Give MSW service worker a moment to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[Storybook] MSW Ready - Stories can now render');
  }
  return {};
};

const preview: Preview = {
  loaders: [ensureMSWReady, mswLoader],
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
  },
};

export default preview;