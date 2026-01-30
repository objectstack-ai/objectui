/**
 * MSW Browser Setup for Storybook
 * 
 * This file integrates the ObjectStack runtime with MSW in browser mode
 * for use within Storybook stories. Based on the pattern from examples/crm-app.
 */

import { ObjectKernel, DriverPlugin, AppPlugin } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { InMemoryDriver } from '@objectstack/driver-memory';
import { MSWPlugin } from '@objectstack/plugin-msw';
import { config as crmConfig } from '@object-ui/example-crm';
import { http, HttpResponse } from 'msw';

let kernel: ObjectKernel | null = null;

export async function startMockServer() {
  if (kernel) return kernel;

  console.log('[Storybook MSW] Starting ObjectStack Runtime (Browser Mode)...');
  console.log('[Storybook MSW] Loaded Config:', crmConfig ? 'Found' : 'Missing', crmConfig?.apps?.length);

  if (crmConfig && crmConfig.objects) {
    console.log('[Storybook MSW] Objects in Config:', crmConfig.objects.map(o => o.name));
  } else {
    console.error('[Storybook MSW] No objects found in config!');
  }

  const driver = new InMemoryDriver();
  kernel = new ObjectKernel();

  try {
    kernel
        .use(new ObjectQLPlugin())
        .use(new DriverPlugin(driver, 'memory'));

    if (crmConfig) {
        kernel.use(new AppPlugin(crmConfig));
    } else {
        console.error('❌ CRM Config is missing! Skipping AppPlugin.');
    }

    kernel.use(new MSWPlugin({
        enableBrowser: true,
        baseUrl: '/api/v1', 
        logRequests: true,
        customHandlers: [
            // Handle /api/v1/index.json for ObjectStackClient.connect() - try all URL variations
            http.get('*/api/v1/index.json', async () => {
                console.log('[MSW Custom Handler] Intercepted /api/v1/index.json (wildcard)');
                return HttpResponse.json({
                    version: '1.0',
                    objects: ['contact', 'opportunity', 'account'],
                    endpoints: {
                        data: '/api/v1/data',
                        metadata: '/api/v1/metadata'
                    }
                });
            }),
            // Explicitly handle all metadata requests to prevent pass-through
            http.get('/api/v1/metadata/*', async () => {
                 return HttpResponse.json({});
            }),
            http.get('/api/bootstrap', async () => {
                const contacts = await driver.find('contact', { object: 'contact' });
                const stats = { revenue: 125000, leads: 45, deals: 12 };
                return HttpResponse.json({
                    user: { name: "Demo User", role: "admin" },
                    stats,
                    contacts: contacts || []
                });
            })
        ]
    }));
    
    console.log('[Storybook MSW] Bootstrapping kernel...');
    await kernel.bootstrap();
    console.log('[Storybook MSW] Bootstrap Complete');

    // Seed Data
    if (crmConfig) {
        await initializeMockData(driver);
    }
  } catch (err: any) {
    console.error('❌ Storybook Mock Server Start Failed:', err);
    throw err;
  }
  
  return kernel;
}

// Helper to seed data into the in-memory driver
async function initializeMockData(driver: InMemoryDriver) {
    console.log('[Storybook MSW] Initializing mock data...');
    // @ts-ignore
    const manifest = crmConfig.manifest;
    if (manifest && manifest.data) {
        for (const dataSet of manifest.data) {
            console.log(`[Storybook MSW] Seeding ${dataSet.object}...`);
            if (dataSet.records) {
                for (const record of dataSet.records) {
                    await driver.create(dataSet.object, record);
                }
            }
        }
    }
}

export { kernel };
