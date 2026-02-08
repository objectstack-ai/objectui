/**
 * MSW Browser Worker Setup via ObjectStack Service
 * 
 * This creates a complete ObjectStack environment in the browser using the In-Memory Driver
 * and the MSW Plugin which automatically exposes the API.
 */

import { ObjectKernel, DriverPlugin, AppPlugin } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { InMemoryDriver } from '@objectstack/driver-memory';
import { MSWPlugin } from '@objectstack/plugin-msw';
import { setupWorker } from 'msw/browser';
import appConfig from '../../objectstack.shared';

let kernel: ObjectKernel | null = null;
let driver: InMemoryDriver | null = null;

export async function startMockServer() {
  // Polyfill process.on for ObjectKernel in browser environment
  // This prevents the "process.on is not a function" error when ObjectKernel initializes
  try {
    if (typeof process !== 'undefined' && !(process as any).on) {
      (process as any).on = () => {};
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[MSW] Failed to polyfill process.on', e);
  }

  if (kernel) {
    if (import.meta.env.DEV) console.log('[MSW] ObjectStack Runtime already initialized');
    return kernel;
  }

  if (import.meta.env.DEV) console.log('[MSW] Starting ObjectStack Runtime (Browser Mode)...');

  driver = new InMemoryDriver();

  // Create kernel with MiniKernel architecture
  kernel = new ObjectKernel({
    skipSystemValidation: true
  });
  
  // Register ObjectQL engine
  await kernel.use(new ObjectQLPlugin())
    
  // Register the driver
  await kernel.use(new DriverPlugin(driver, 'memory'))
    
  // Load app config as a plugin
  await kernel.use(new AppPlugin(appConfig))
    
  // MSW Plugin (intercepts network requests)
  // Disable auto-start to manually control worker registration with correct path
  const mswPlugin = new MSWPlugin({
    enableBrowser: true, 
    baseUrl: '/api/v1',
    logRequests: true
  });

  await kernel.use(mswPlugin);
  
  await kernel.bootstrap();

  // Manually start MSW worker with correct service worker path
  if (typeof window !== 'undefined') {
    const handlers = mswPlugin.getHandlers();
    const worker = setupWorker(...handlers);
    
    // unless vite base is handled strangely. But typically public assets follow base.
    const swUrl = '/mockServiceWorker.js';

    if (import.meta.env.DEV) console.log(`[MSW] Starting worker with script at: ${swUrl}`);
    
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: swUrl
      }
    });
  }

  // Note: AppPlugin already loads manifest data during bootstrap via the Seeder,
  // so we don't need to manually seed it again here. Doing so would create duplicates.

  if (import.meta.env.DEV) console.log('[MSW] ObjectStack Runtime ready');
  return kernel;
}

export function getKernel(): ObjectKernel | null {
  return kernel;
}

export function getDriver(): InMemoryDriver | null {
  return driver;
}
